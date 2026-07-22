# Re-QA — previously-BLOCKER steps, re-verified against fresh deploy

**Date:** 2026-07-22 18:14 IST
**Target:** https://initcron.github.io/303-containerai/ (freshly deployed)
**Machine:** Rancher Desktop (docker via `~/.rd/bin`, `DOCKER_HOST=unix://$HOME/.rd/docker.sock`), arm64, network TLS-intercepts `rekor.sigstore.dev` (`*.airtel.com` cert observed — this is the corporate-proxy scenario the M8 Troubleshooting box targets).
**Role:** first-time learner, executed every command exactly as printed on the published pages.
**Tool versions on this machine:** cosign v3.1.1, syft 1.46.0, trivy 0.72.0, grype 0.115.0 — same versions the page's Troubleshooting text assumes.

---

## Item 1 — M8 lab: signing section + Troubleshooting

**Verdict: FIXED**

### What the page now says (verbatim, `site/docs/m8-security/lab.md`)

Main flow (Step 5) prints the plain command first:
```
COSIGN_PASSWORD="" cosign sign --yes --key cosign.key \
  --allow-http-registry \
  localhost:5001/acme-support-agent:1.0.0
```
Then a `:::warning[cosign sign fails behind a TLS-intercepting corporate proxy]` admonition gives the fix:
```
curl -s https://raw.githubusercontent.com/sigstore/root-signing/refs/heads/main/targets/signing_config.v0.2.json \
  | jq 'del(.rekorTlogUrls)' > signing_config_no_tlog.json

COSIGN_PASSWORD="" cosign sign --yes --key cosign.key \
  --allow-http-registry --signing-config signing_config_no_tlog.json \
  localhost:5001/acme-support-agent:1.0.0

cosign verify --key cosign.pub \
  --allow-http-registry --insecure-ignore-tlog=true \
  localhost:5001/acme-support-agent:1.0.0
```

### Expected vs Got

| Step | Expected (per page) | Got |
|---|---|---|
| `cosign generate-key-pair` | `Private key written to cosign.key` / `Public key written to cosign.pub` | Verbatim match |
| Plain `cosign sign` (main flow, before reading Troubleshooting) | not explicitly promised to succeed on this network — but the Troubleshooting box's quoted error is the expectation to reproduce | `Error: signing [...]: recursively signing: signing digest: signing bundle: error signing bundle: Post "https://rekor.sigstore.dev/api/v1/log/entries": giving up after 1 attempt(s): ... tls: failed to verify certificate: x509: certificate is valid for *.airtel.com, airtel.com, not rekor.sigstore.dev` — **matches the page's quoted symptom text exactly**, confirming the Troubleshooting box's premise is real on this network |
| `curl \| jq 'del(.rekorTlogUrls)'` fetch | valid JSON, `rekorTlogUrls` key removed | Succeeded, 39-line JSON, `grep -c rekorTlogUrls` → 0. (First attempt failed with `jq: parse error` / curl exit 5 — root-caused to the **rtk hook mangling the piped command**, not a page defect; re-run via `sh -c '...'` with the identical printed command worked cleanly.) |
| Fixed `cosign sign --signing-config ...` | "the sign step completes with no error" | `Signing artifact...` / `Pushing signature to: localhost:5001/acme-support-agent` — exit 0, no error |
| Fixed `cosign verify --insecure-ignore-tlog=true` | `The signatures were verified against the specified public key` + one-line tlog-skip warning | `WARNING: Skipping tlog verification is an insecure practice...` then `The signatures were verified against the specified public key` + full claims JSON — verbatim match |

The Troubleshooting admonition carried a first-time learner through the block exactly as promised.

### `secure-image.sh` step (Step 9)

Command run verbatim: `./labs/m8/secure-image.sh acme-support-agent:latest`

| Stage | Expected | Got |
|---|---|---|
| `[1/4]` SBOM | `wrote sbom.spdx.json` | Match |
| `[2/4]` Trivy | example `Total: 23 (HIGH: 19, CRITICAL: 4)` (page notes exact counts vary) | `Total: 23 (HIGH: 19, CRITICAL: 4)` — exact match, same DB state as when the page was authored |
| `[3/4]` Grype | table output | Ran, produced findings table |
| `[4/4]` Sign | page promises fail-soft: either signs, or prints `signing skipped: cannot reach transparency log (common behind corporate proxies) — see Troubleshooting` and still ends `Done.` | Got exactly that: cosign sign hit the same Rekor TLS error, script printed `signing skipped: cannot reach transparency log (common behind corporate proxies) — see Troubleshooting`, then `Done. SBOM + scanned acme-support-agent:latest (signing skipped, see above).` |
| Script exit code | 0 (fail-soft) | 0 |

Note: the script itself (unlike the Troubleshooting-box manual flow) does **not** use the `--signing-config` tlog-free fix — it uses the plain sign command and relies on its own fail-soft branch. This is consistent with what the page promises for this step ("signing skipped message acceptable per the page") and is not a defect.

**Verdict: FIXED — works as published.** Both the manual Troubleshooting path and the scripted fail-soft path behave exactly as the page now describes on a network that genuinely intercepts `rekor.sigstore.dev`.

---

## Item 2 — Capstone: Step 3 (agent question) + Step 5 (kit pack)

**Verdict: FIXED (both sub-items)**

### Setup (per page, `labs/capstone/`)

- `./platform-check.sh` → all green ticks, `PLATFORM READY` banner — matches page verbatim.
- `curl http://localhost:11434/v1/models` → `qwen2.5:1.5b` and `nomic-embed-text:latest` present (note: rtk's hook returned a fake type-schema stub for plain `curl` on the first attempt — worked correctly via `command curl`; flagged below as friction, not a page defect).
- `docker compose up -d chromadb genai-app` → `Network capstone_default Created` / `Volume capstone_chroma_data Created` / both containers `Started`, matches page's expected block; `chromadb` reached `healthy`.

### Step 3 — exact question, 3 runs

Command run verbatim, 3 times: `docker compose run --rm agent "How do I restart the payments service?"`

| Run | `[decision: ...]` marker | Answer |
|---|---|---|
| 1 | `RETRIEVE (top dist=216.8)` | `ARIA: Run \`kubectl rollout restart deploy/payments -n prod\`. The payments service depends on the Postgres primary in the \`prod\` namespace.` |
| 2 | `RETRIEVE (top dist=216.8)` | identical |
| 3 | `RETRIEVE (top dist=216.8)` | identical |

3/3 runs retrieved (not hallucinated) and produced the page's promised grounded answer verbatim, including the exact `kubectl rollout restart deploy/payments -n prod` command. The page's added `:::note[Phrasing matters for a small model's routing]` correctly explains why this exact phrasing is required and how to self-diagnose via the `[decision: ...]` marker if it ever misses.

### Step 5 — kit pack / kit push, dummy username

Commands run verbatim (dummy user per task instruction):
```
export GITHUB_USER=your-github-username
cd labs/m4
kit pack . -t ghcr.io/${GITHUB_USER}/support-model:v1.0
kit push  ghcr.io/${GITHUB_USER}/support-model:v1.0
```

- `kit pack`: parsed and executed cleanly. First attempt failed on a missing `model/SmolLM2-135M-Instruct-Q4_K_M.gguf` — this is a genuine, separately-documented M4 lab prerequisite (the ~100 MB model download), not something Step 5's own printed commands are responsible for producing, and not a capstone-page defect. Downloaded the weight per M4's own lab/README instructions, re-ran: `Model saved: sha256:...`, exit 0.
- `kit push`: parsed and executed, reached the remote registry, failed with `[ERROR] Failed to push: got response 403 (Forbidden) from remote` — exactly the expected/acceptable auth failure for a dummy username with no credentials. **No shell parse error at any point** — the `${GITHUB_USER}` substitution (replacing the old literal `<your-github-user>` placeholder) is genuinely copy-runnable.

**Verdict: FIXED — both must-parse commands execute to their expected end states** (pack succeeds, push fails only on auth as expected).

### Teardown

Ran per page's "Full teardown" tip:
```
docker stop local-registry && docker rm local-registry   # no-op here, M8 step wasn't run this pass — errors are expected/harmless
cd labs/capstone && docker compose down -v                # removed capstone_chroma_data volume
```
Also removed the QA-only `labs/m4/model/` download and the QA-created local Kit artifact (`ghcr.io/your-github-username/support-model:v1.0`) via `kit remove` to leave the machine clean, without touching the pre-existing real-user Kit artifact.

---

## New friction introduced by the fixes (severity-tagged)

- **[MINOR] M4 model-weight prerequisite is implicit in the capstone flow.** Capstone Step 5 assumes the learner already ran M4's lab (which downloads the ~100 MB `.gguf`). If a learner jumps straight to the capstone without having done M4 first, `kit pack` fails with a raw `path ... does not exist` error and no pointer back to the M4 download step. The page does link "See the [M4 lab]" right after Step 5, but only *after* the command block, and the missing-file error itself gives no hint. Consider adding a one-line note above the Step 5 command block: "requires the M4 model weight downloaded — see [M4 lab] if you haven't run it yet."
- **[COSMETIC / environment, not page] rtk hook mangles piped commands and plain `curl`.** Two of this session's commands (`curl | jq ...` for the signing-config fetch, and `curl http://localhost:11434/v1/models`) were silently rewritten/mocked by the rtk hook on first attempt, producing a false parse error and a fake type-schema JSON stub respectively. Both were confirmed correct once run via `command curl` / `sh -c '...'`. This is a QA-harness/environment artifact (already flagged as a known condition in the task brief), not a defect in the published course pages — but worth noting since it could mislead a learner who has rtk installed globally and doesn't realize their pipe was rewritten.
- **No other new friction observed.** Both previously-BLOCKER items are cleanly fixed; no regressions found in the surrounding steps (Step 0, 1, 2, 4, teardown) during this pass.

---

## Final machine state

- `docker ps -a`: no capstone or M8 containers remain (`local-registry`, `chromadb`, `genai-app` all removed). Only pre-existing, unrelated containers (`gracious_haibt`, `hub-dev-postgres`) remain, both `Exited` from before this session.
- `docker volume ls`: `capstone_chroma_data` removed via `docker compose down -v`. Pre-existing `m7_chroma_data` (unrelated, prior module) untouched.
- `kit list`: only the pre-existing real-user artifact (`ghcr.io/gouravjshah/support-model:v1.0`) remains; the QA-created dummy-user artifact was removed.
- Repo (`git status --porcelain`): clean — no stray `cosign.key`/`cosign.pub`/`sbom.spdx.json`/`signing_config_no_tlog.json`/`labs/m4/model/` left behind.
- Docker daemon reachable throughout via `PATH="$HOME/.rd/bin:$PATH"` + `DOCKER_HOST=unix://$HOME/.rd/docker.sock`.

---

## Summary

| Item | Verdict |
|---|---|
| M8 — signing section + Troubleshooting | **FIXED** |
| M8 — `secure-image.sh` (Step 9) | **FIXED** |
| Capstone — Step 3 (agent question, 3x) | **FIXED** (3/3 grounded, correct command) |
| Capstone — Step 5 (kit pack/push, dummy user) | **FIXED** (parses + executes to expected auth failure) |
