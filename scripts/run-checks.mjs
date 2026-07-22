import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function evalAssert(a, { code, stdout }) {
  if ('exit' in a) return code === a.exit;
  if ('contains' in a) return stdout.includes(a.contains);
  if ('absent' in a) return !stdout.includes(a.absent);
  // 'm' flag: `^`/`$` anchor per-line, so a trailing newline (e.g. from `| tail -1`)
  // doesn't defeat an anchored `^...$` check. Line-anchoring is the author's intent.
  if ('matches' in a) return new RegExp(a.matches, 'm').test(stdout);
  throw new Error(`unknown assert: ${JSON.stringify(a)}`);
}

export function runChecks(checksObj, exec) {
  const list = checksObj.checks ?? [];
  const results = [];
  let passed = 0, score = 0, maxScore = 0;
  for (const c of list) {
    const w = c.weight ?? 1;
    maxScore += w;
    let pass = false;
    try { pass = evalAssert(c.assert, exec(c.run)); } catch { pass = false; }
    if (pass) { passed += 1; score += w; }
    results.push({ id: c.id, describe: c.describe ?? c.id, pass });
  }
  return { results, passed, total: list.length, score, maxScore };
}

// CLI entry
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2];
  if (!path) { console.error('usage: node scripts/run-checks.mjs <checks.json>'); process.exit(2); }
  const { execSync } = await import('node:child_process');
  const realExec = (cmd) => {
    try { return { code: 0, stdout: execSync(`{ ${cmd} ; } 2>&1`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
    catch (e) { return { code: e.status ?? 1, stdout: (e.stdout ?? '') + (e.stderr ?? '') }; }
  };
  const r = runChecks(JSON.parse(readFileSync(path, 'utf8')), realExec);
  for (const x of r.results) console.log(`${x.pass ? '✅' : '❌'} ${x.id} — ${x.describe}`);
  console.log(`\n${r.passed}/${r.total} checks · score ${r.score}/${r.maxScore}`);
  process.exit(r.passed === r.total ? 0 : 1);
}
