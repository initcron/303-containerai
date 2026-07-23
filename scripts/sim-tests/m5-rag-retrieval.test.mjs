#!/usr/bin/env node
// Headless-Chrome assertion harness for m5-rag-retrieval.html
// Zero runtime deps: hand-rolled CDP client over Node built-ins (http + ws frames).
// Chrome 150+: uses PUT /json/new?<url> and launch flag --remote-allow-origins=*.
// Drives the sim through window.__sim (pure formulae, no wall-clock waits).
// Run: node scripts/sim-tests/m5-rag-retrieval.test.mjs

import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, '..', '..', 'site', 'static', 'sims', 'm5-rag-retrieval.html');
const FILE_URL = pathToFileURL(HTML).href;
const PORT = 9460 + (process.pid % 400);

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => { try { fs.accessSync(p); return true; } catch { return false; } });
if (!CHROME) { console.error('No Chrome/Chromium found'); process.exit(2); }

let PASS = 0, FAIL = 0;
const results = [];
function ok(name, cond, detail) {
  if (cond) { PASS++; results.push('  PASS  ' + name); }
  else { FAIL++; results.push('  FAIL  ' + name + (detail ? '  — ' + detail : '')); }
}

// ---- minimal CDP over WebSocket (RFC6455 client, no deps) ----
function httpJSON(method, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: urlPath, method,
      headers: { 'Content-Type': 'application/json' } }, res => {
      let b = ''; res.on('data', d => b += d); res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    });
    req.on('error', reject); req.end();
  });
}
function connectWS(wsUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(wsUrl);
    const sock = net.connect(Number(u.port), u.hostname, () => {
      const key = crypto.randomBytes(16).toString('base64');
      sock.write(
        `GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\n` +
        `Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n` +
        `Origin: http://127.0.0.1:${PORT}\r\n\r\n`);
    });
    let handshaken = false; let buf = Buffer.alloc(0);
    const listeners = new Map(); let idc = 1; const evwaiters = [];
    function send(method, params = {}, sessionId) {
      const id = idc++; const msg = { id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      sock.write(encodeFrame(JSON.stringify(msg)));
      return new Promise(res => listeners.set(id, res));
    }
    sock.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (!handshaken) {
        const idx = buf.indexOf('\r\n\r\n');
        if (idx === -1) return;
        handshaken = true; buf = buf.slice(idx + 4);
        resolve({ send, onEvent: (m, cb) => evwaiters.push({ m, cb }), close: () => sock.destroy() });
      }
      let f;
      while ((f = decodeFrame(buf))) {
        buf = f.rest;
        if (f.opcode === 8) { sock.destroy(); break; }
        if (f.opcode === 1 || f.opcode === 2) {
          let m; try { m = JSON.parse(f.payload.toString()); } catch { continue; }
          if (m.id && listeners.has(m.id)) { listeners.get(m.id)(m); listeners.delete(m.id); }
          if (m.method) evwaiters.filter(w => w.m === m.method).forEach(w => w.cb(m.params));
        }
      }
    });
    sock.on('error', reject);
  });
}
function encodeFrame(str) {
  const p = Buffer.from(str); const len = p.length;
  const mask = crypto.randomBytes(4); let header;
  if (len < 126) header = Buffer.from([0x81, 0x80 | len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), 2); }
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = p[i] ^ mask[i & 3];
  return Buffer.concat([header, mask, masked]);
}
function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f; const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f; let off = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
  let mask; if (masked) { if (buf.length < off + 4) return null; mask = buf.slice(off, off + 4); off += 4; }
  if (buf.length < off + len) return null;
  let payload = buf.slice(off, off + len);
  if (masked) { const o = Buffer.alloc(len); for (let i = 0; i < len; i++) o[i] = payload[i] ^ mask[i & 3]; payload = o; }
  return { opcode, payload, rest: buf.slice(off + len) };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const child = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
    '--no-sandbox', '--disable-gpu', '--window-size=900,560',
    '--user-data-dir=/tmp/m5-rag-chrome-' + process.pid, 'about:blank',
  ], { stdio: 'ignore' });

  let version;
  for (let i = 0; i < 60; i++) {
    try { version = await httpJSON('GET', '/json/version'); if (version && version.webSocketDebuggerUrl) break; } catch {}
    await sleep(150);
  }
  if (!version || !version.webSocketDebuggerUrl) { console.error('devtools endpoint never came up'); child.kill('SIGKILL'); process.exit(2); }

  const tab = await httpJSON('PUT', '/json/new?' + encodeURIComponent(FILE_URL));
  const cdp = await connectWS(tab.webSocketDebuggerUrl);

  const consoleErrors = [], pageErrors = [], netRequests = [];
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  cdp.onEvent('Runtime.consoleAPICalled', p => { if (p.type === 'error') consoleErrors.push(JSON.stringify(p.args)); });
  cdp.onEvent('Runtime.exceptionThrown', p => pageErrors.push(p.exceptionDetails && p.exceptionDetails.text));
  cdp.onEvent('Network.requestWillBeSent', p => {
    const u = p.request.url;
    if (!u.startsWith('file://') && !u.startsWith('data:') && !u.startsWith('about:')) netRequests.push(u);
  });

  await cdp.send('Emulation.setDeviceMetricsOverride',
    { width: 900, height: 560, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: FILE_URL });
  await sleep(700);

  async function ev(expr) {
    const r = await cdp.send('Runtime.evaluate',
      { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    if (r.result && r.result.result) return r.result.result.value;
    return undefined;
  }
  async function reload() { await ev('location.reload()'); await sleep(500); }

  // ---------- 1. loads clean (R1) ----------
  ok('R1 no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  ok('R1 no page exceptions', pageErrors.length === 0, pageErrors.join(' | '));
  ok('R1 zero external network requests', netRequests.length === 0, netRequests.join(' | '));
  ok('renders — size pills present (5)', (await ev('document.querySelectorAll("#sizePills .pill").length')) === 5);
  ok('renders — overlap pills present (3)', (await ev('document.querySelectorAll("#ovPills .pill").length')) === 3);
  ok('renders — k pills present (3)', (await ev('document.querySelectorAll("#kPills .pill").length')) === 3);
  ok('renders — question options present (4)', (await ev('document.querySelectorAll("#qList .qopt").length')) === 4);
  ok('renders — corpus strip has chips', (await ev('document.querySelectorAll("#corpusStrip .chip").length > 0')) === true);
  ok('test hook exposed', (await ev('typeof window.__sim')) === 'object');

  // ---------- 2. affordance sanity (R2) ----------
  const affClickable = await ev(`(function(){
    var bad=[];
    var e=document.querySelector('#reset');
    if(!/pointer/.test(getComputedStyle(e).cursor)) bad.push('reset:cursor');
    document.querySelectorAll('#sizePills .pill').forEach(function(p){
      if(!/pointer/.test(getComputedStyle(p).cursor)) bad.push('sizePill:cursor');
    });
    document.querySelectorAll('#ovPills .pill').forEach(function(p){
      if(!/pointer/.test(getComputedStyle(p).cursor)) bad.push('ovPill:cursor');
    });
    document.querySelectorAll('#kPills .pill').forEach(function(p){
      if(!/pointer/.test(getComputedStyle(p).cursor)) bad.push('kPill:cursor');
    });
    document.querySelectorAll('#qList .qopt').forEach(function(p){
      if(!/pointer/.test(getComputedStyle(p).cursor)) bad.push('qopt:cursor');
    });
    return bad;
  })()`);
  ok('R2 interactive controls have pointer cursor', affClickable.length === 0, affClickable.join(','));
  const tips = await ev(`(function(){
    var pillTip = Array.prototype.every.call(
      document.querySelectorAll('#sizePills .pill, #ovPills .pill, #kPills .pill, #qList .qopt'),
      function(c){return !!c.title;});
    return !!document.querySelector('#reset').title && pillTip;
  })()`);
  ok('R2 reset + pills + question options carry tooltips (title)', tips === true);
  const inertLog = await ev(`getComputedStyle(document.querySelector('#evList')).cursor`);
  ok('R2 event log is inert (cursor:default)', inertLog === 'default', inertLog);
  const inertReadout = await ev(`getComputedStyle(document.querySelector('#readout')).cursor`);
  ok('R2 distance readout panel is inert (cursor:default)', inertReadout === 'default', inertReadout);
  const inertMeter = await ev(`getComputedStyle(document.querySelector('.meterWrap')).cursor`);
  ok('R2 context-budget gauge is inert (cursor:default)', inertMeter === 'default', inertMeter);
  const inertQual = await ev(`getComputedStyle(document.querySelector('.qualBox')).cursor`);
  ok('R2 answer-quality indicator is inert (cursor:default)', inertQual === 'default', inertQual);
  const noteTip = await ev(`document.querySelector('#note').getAttribute('data-tip') || ''`);
  ok('R8 honest-model footnote present + names real anchors + real tool stack',
    /teaching model/i.test(noteTip) && /nomic-embed-text/.test(noteTip) && /0\.6956/.test(noteTip) && /0\.3700/.test(noteTip) && /orphan/i.test(noteTip),
    noteTip.slice(0, 80));

  // ---------- 3. THE LOAD-BEARING NUMBERS: real captured anchors reproduced EXACTLY ----------
  const anchorBase = await ev(`(function(){
    return {
      chunks: window.__sim.chunkCorpus(500,50).length,
      payments: window.__sim.distanceFor('payments',500,50),
      checkout: window.__sim.distanceFor('checkout',500,50),
      backups: window.__sim.distanceFor('backups',500,50),
      oncall: window.__sim.distanceFor('oncall',500,50)
    };
  })()`);
  ok('ANCHOR baseline 500/50 -> 2 chunks (real captured)', anchorBase.chunks === 2, JSON.stringify(anchorBase));
  ok('ANCHOR baseline 500/50 payments dist == 0.6956 (real captured)', Math.abs(anchorBase.payments - 0.6956) < 0.0001, JSON.stringify(anchorBase));
  ok('ANCHOR baseline 500/50 checkout dist == 0.7755 (real captured)', Math.abs(anchorBase.checkout - 0.7755) < 0.0001, JSON.stringify(anchorBase));
  ok('ANCHOR baseline 500/50 backups dist == 0.7746 (real captured)', Math.abs(anchorBase.backups - 0.7746) < 0.0001, JSON.stringify(anchorBase));
  ok('ANCHOR baseline 500/50 oncall dist == 0.9238 (real captured)', Math.abs(anchorBase.oncall - 0.9238) < 0.0001, JSON.stringify(anchorBase));

  const anchorA = await ev(`(function(){
    return {
      chunks: window.__sim.chunkCorpus(150,0).length,
      payments: window.__sim.distanceFor('payments',150,0),
      checkout: window.__sim.distanceFor('checkout',150,0),
      backups: window.__sim.distanceFor('backups',150,0),
      oncall: window.__sim.distanceFor('oncall',150,0)
    };
  })()`);
  ok('ANCHOR variant-a 150/0 -> 11 chunks (real captured)', anchorA.chunks === 11, JSON.stringify(anchorA));
  ok('ANCHOR variant-a 150/0 payments dist == 0.5146 (real captured)', Math.abs(anchorA.payments - 0.5146) < 0.0001, JSON.stringify(anchorA));
  ok('ANCHOR variant-a 150/0 checkout dist == 0.7244 (real captured)', Math.abs(anchorA.checkout - 0.7244) < 0.0001, JSON.stringify(anchorA));
  ok('ANCHOR variant-a 150/0 backups dist == 0.3700 (real captured, orphan heading)', Math.abs(anchorA.backups - 0.3700) < 0.0001, JSON.stringify(anchorA));
  ok('ANCHOR variant-a 150/0 oncall dist == 0.7124 (real captured)', Math.abs(anchorA.oncall - 0.7124) < 0.0001, JSON.stringify(anchorA));

  const anchorB = await ev(`(function(){
    return {
      chunks: window.__sim.chunkCorpus(1200,200).length,
      payments: window.__sim.distanceFor('payments',1200,200),
      checkout: window.__sim.distanceFor('checkout',1200,200),
      backups: window.__sim.distanceFor('backups',1200,200),
      oncall: window.__sim.distanceFor('oncall',1200,200)
    };
  })()`);
  ok('ANCHOR variant-b 1200/200 -> 1 chunk (real captured)', anchorB.chunks === 1, JSON.stringify(anchorB));
  ok('ANCHOR variant-b 1200/200 payments dist == 0.7515 (real captured)', Math.abs(anchorB.payments - 0.7515) < 0.0001, JSON.stringify(anchorB));
  ok('ANCHOR variant-b 1200/200 checkout dist == 0.9773 (real captured)', Math.abs(anchorB.checkout - 0.9773) < 0.0001, JSON.stringify(anchorB));
  ok('ANCHOR variant-b 1200/200 backups dist == 0.8759 (real captured)', Math.abs(anchorB.backups - 0.8759) < 0.0001, JSON.stringify(anchorB));
  ok('ANCHOR variant-b 1200/200 oncall dist == 1.0830 (real captured)', Math.abs(anchorB.oncall - 1.0830) < 0.0001, JSON.stringify(anchorB));

  // ---------- 4. ORPHAN-HEADING TEACHING INVARIANT: 150/0 backups top chunk is heading-only ----------
  const orphanCheck = await ev(`(function(){
    var chunks = window.__sim.chunkCorpus(150,0);
    var headingOnly = chunks.filter(function(c){ return /^#{1,6}\\s/.test(c.trim()) && c.trim().length < 40; });
    return { count: chunks.length, headingOnlyCount: headingOnly.length, headingOnlyText: headingOnly.map(function(c){return c.trim();}) };
  })()`);
  ok('INVARIANT 150/0 chunking produces at least one heading-only orphan chunk',
    orphanCheck.headingOnlyCount >= 1, JSON.stringify(orphanCheck));
  ok('INVARIANT the orphan chunk is "## Database backups" (matches deep-dive §7 exactly)',
    orphanCheck.headingOnlyText.some(function(t){ return /database backups/i.test(t); }), JSON.stringify(orphanCheck));

  // ---------- 5. TEACHING INVARIANT: chunk count is monotone non-increasing as chunk size grows ----------
  const monotoneChunks = await ev(`(function(){
    var bad=[];
    [0,50,200].forEach(function(ov){
      var prev=Infinity;
      [150,300,500,800,1200].forEach(function(sz){
        var n=window.__sim.chunkCorpus(sz,ov).length;
        if(n>prev){ bad.push(sz+'|'+ov); }
        prev=n;
      });
    });
    return bad;
  })()`);
  ok('INVARIANT chunk count is monotone non-increasing as chunk size grows (fixed overlap)',
    monotoneChunks.length === 0, monotoneChunks.join(','));

  // ---------- 6. TEACHING INVARIANT: noise dilution — 1200/200 (1 chunk) has the worst distances overall ----------
  const dilution = await ev(`(function(){
    var d1200 = ['payments','checkout','backups','oncall'].map(function(q){return window.__sim.distanceFor(q,1200,200);});
    var d500 = ['payments','checkout','backups','oncall'].map(function(q){return window.__sim.distanceFor(q,500,50);});
    var avg = function(a){return a.reduce(function(x,y){return x+y;},0)/a.length;};
    return { avg1200: avg(d1200), avg500: avg(d500) };
  })()`);
  ok('INVARIANT the largest chunk config (1200/200, 1 chunk) has worse avg distance than the baseline',
    dilution.avg1200 > dilution.avg500, JSON.stringify(dilution));

  // ---------- 7. context-budget arithmetic is real (~4 chars/token, num_ctx=4096) ----------
  const budgetConsts = await ev(`window.__sim.consts`);
  ok('BUDGET num_ctx = 4096 (real Ollama setting)', budgetConsts.NUM_CTX === 4096, JSON.stringify(budgetConsts));
  ok('BUDGET chars-per-token = 4 (real page arithmetic)', budgetConsts.CHARS_PER_TOKEN === 4, JSON.stringify(budgetConsts));

  // ---------- 8. TRY-THIS challenge, driven end to end ----------
  await reload();
  // Step 1: reproduce the orphan-heading trap
  await ev(`window.__sim.setSize(150)`);
  await ev(`window.__sim.setOverlap(0)`);
  await ev(`window.__sim.setQ('backups')`);
  const step1 = await ev(`({step:window.__sim.CH.step, done1:window.__sim.CH.done[0]})`);
  ok('TRY-THIS step 1 auto-detected (150/0 + backups question -> orphan heading trap)', step1.done1 === true && step1.step === 2, JSON.stringify(step1));

  // Step 2: blow the context budget (big chunks x top-5)
  await ev(`window.__sim.setSize(1200)`);
  await ev(`window.__sim.setK(5)`);
  const step2 = await ev(`({step:window.__sim.CH.step, done2:window.__sim.CH.done[1]})`);
  ok('TRY-THIS step 2 auto-detected (1200 chunk x k=5 pressures context budget)', step2.done2 === true && step2.step === 3, JSON.stringify(step2));

  // Step 3: payments question, distance < 0.7, budget < 25%
  await ev(`window.__sim.setSize(500)`);
  await ev(`window.__sim.setOverlap(50)`);
  await ev(`window.__sim.setK(1)`);
  await ev(`window.__sim.setQ('payments')`);
  const step3 = await ev(`({step:window.__sim.CH.step, done3:window.__sim.CH.done[2],
    success:document.getElementById('challenge').classList.contains('success')})`);
  ok('TRY-THIS step 3 auto-detected (payments question, dist<0.7, budget<25%)', step3.done3 === true && step3.step >= 4, JSON.stringify(step3));
  ok('CHALLENGE completes: success banner shown', step3.success === true, JSON.stringify(step3));

  // completion cannot be spoofed: step 1 should not complete from an unrelated dial combo
  await reload();
  await ev(`window.__sim.setSize(1200)`);
  await ev(`window.__sim.setOverlap(200)`);
  await ev(`window.__sim.setQ('payments')`);
  const noSpoof = await ev(`({step:window.__sim.CH.step, done1:window.__sim.CH.done[0]})`);
  ok('CHALLENGE step 1 does NOT complete from an unrelated dial combo (must actually produce the trap)', noSpoof.done1 === false && noSpoof.step === 1, JSON.stringify(noSpoof));

  // ---------- 9. event log responds in domain vocabulary (R7) ----------
  await reload();
  await ev(`window.__sim.setSize(150)`);
  const logChunk = await ev(`Array.from(document.querySelectorAll('#evList .ev')).some(function(e){return /re-chunked/.test(e.textContent) && /chunks/.test(e.textContent);})`);
  ok('EVENT LOG a chunk-size change logs a "re-chunked: N chunks" line', logChunk === true);
  await ev(`window.__sim.setQ('backups')`);
  const logQuery = await ev(`Array.from(document.querySelectorAll('#evList .ev')).some(function(e){return /retrieved/.test(e.textContent) && /dist/.test(e.textContent);})`);
  ok('EVENT LOG a question change logs a "retrieved #N dist X" line', logQuery === true);
  const bootLog = await ev(`Array.from(document.querySelectorAll('#evList .ev')).some(function(e){return /ready/.test(e.textContent) && /ChromaDB/.test(e.textContent);})`);
  ok('EVENT LOG boot sequence includes a ChromaDB/genai-app ready line', bootLog === true);

  // ---------- 10. Reset returns to initial state (R5) ----------
  await ev(`window.__sim.setSize(1200);window.__sim.setOverlap(200);window.__sim.setK(5);window.__sim.setQ('oncall')`);
  await ev('location.reload()'); await sleep(500);
  const afterReset = await ev(`(function(){var s=window.__sim.S;return {
    size:s.size, overlap:s.overlap, k:s.k, q:s.q, chStep:window.__sim.CH.step};})()`);
  const D = await ev('window.__sim.consts.DEFAULTS');
  ok('R5 Reset restores defaults (500/50, k=3, payments question, challenge step 1)',
    afterReset.size === D.size && afterReset.overlap === D.overlap && afterReset.k === D.k && afterReset.q === D.q && afterReset.chStep === 1,
    JSON.stringify({ afterReset, D }));

  // ---------- 11. no scroll at embed size ----------
  const scroll = await ev('({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,cw:window.innerWidth,ch:window.innerHeight})');
  ok('NO horizontal scroll @900x560', scroll.sw <= scroll.cw + 1, JSON.stringify(scroll));
  ok('NO vertical scroll @900x560', scroll.sh <= scroll.ch + 1, JSON.stringify(scroll));

  // ---------- 12. prefers-reduced-motion suppresses animation (R4) ----------
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(120);
  await ev(`window.__sim.setSize(800)`); // trigger any transition (meter fill width) under reduced motion
  const reducedOK = await ev(`(function(){
    var bad=[];document.querySelectorAll('*').forEach(function(el){
      var cs=getComputedStyle(el);
      if(cs.animationName!=='none'&&cs.animationDuration!=='0s')bad.push(el.className);
    });return bad.length;})()`);
  ok('R4 prefers-reduced-motion suppresses animations', reducedOK === 0, 'active=' + reducedOK);

  cdp.close();
  child.kill('SIGKILL');
  try { fs.rmSync('/tmp/m5-rag-chrome-' + process.pid, { recursive: true, force: true }); } catch {}

  console.log(results.join('\n'));
  console.log(`\n${PASS}/${PASS + FAIL} assertions passed`);
  process.exit(FAIL === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
