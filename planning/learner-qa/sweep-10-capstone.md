# Learner-QA Sweep 10 — Capstone · Ship the Acme AI Platform

**Date:** 2026-07-22
**Tester role:** Strict first-time learner, published pages only, record-don't-fix.
**Source:** https://initcron.github.io/303-containerai/docs/capstone/{, quiz}
**Starting state:** Fresh clone in scratchpad, matched to `origin/main` (`8ee46fc9`), Rancher Desktop
running, native Ollama on :11434 (qwen2.5:1.5b, nomic-embed-text present), **zero course containers
running** (confirmed via `docker ps -a` before bring-up), images cached from all modules (m2-client,
vllm-cpu-optimized, m5-genai-app, acme-support-agent, acme-incident-crew, chromadb 0.5.20, registry:2),
`m7_chroma_data` volume present and untouched throughout. Unrelated author containers (opsmate-app,
gateway-litellm-1, gateway-pg-1, gateway-analyzer-1, gateway-anonymizer-1) running throughout —
ignored/untouched per instructions.

Note: sitemap.xml served from `initcron.github.io` advertises canonical URLs under
`schoolofdevops.github.io` (the `<link rel="canonical">` and OG tags too) — cosmetic artifact of the
site being built for the `schoolofdevops` org but currently deployed/tested under `initcron`. Not a
functional defect; pages resolve and render correctly at the `initcron.github.io` URLs used for this sweep.

---

## Verdict per page

| Page | Verdict |
|---|---|
| Capstone (lesson+lab combined, `docs/capstone/`) | **PASS-WITH-FINDINGS** |
| Quiz (`docs/capstone/quiz`) | **PASS** |
| Seam M8 → Capstone | **PASS** |

The capstone has only **two** sidebar pages, not three: there is no separate `lab` page — the single
`docs/capstone/` page combines the "lesson" narrative (architecture, portability proof, module ladder)
with the fully executable "lab" steps (0–7) in one continuous page. This differs from every other module
in the course (which each have separate `lesson.md` / `lab.md` / `quiz.mdx`), but it is coherent and
clearly signposted (section "2. Run It End-to-End" is unambiguously the hands-on portion) — not treated
as a defect, just a structural note for the report.

---

## Findings

**F1 — BLOCKER — Step 3's exact copy-paste question never triggers retrieval; the agent hallucinates a
different fictional command on every run instead of returning the runbook's real answer.**
Page: capstone index, "Step 3 — Run the Support Agent (M6)". Command run verbatim:
```
docker compose run --rm agent "payments pod keeps restarting, what do I do?"
```
Expected output (per page, abbreviated):
```
[agent] Aria ready — ingested 5 runbook chunks. Persona from SOUL.md + AGENTS.md + SKILL.md.
USER: payments pod keeps restarting, what do I do?
  [decision: RETRIEVE (top dist=162.x)]
ARIA: Run `kubectl rollout restart deploy/payments -n prod`. ...
```
Got (verbatim, run 3 times to rule out one-off model noise):
```
[decision: ANSWER DIRECTLY (no retrieval)]
ARIA: Run `acme restart payments-pod`.
--- rerun ---
[decision: ANSWER DIRECTLY (no retrieval)]
ARIA: Run `acme-ctl restart payments-pod` to try to fix the issue. ...
--- rerun ---
[decision: ANSWER DIRECTLY (no retrieval)]
ARIA: Run `systemctl restart acme-payments-pod.service`.
```
All three runs: `decision: ANSWER DIRECTLY (no retrieval)` (never `RETRIEVE` as the page promises), and
a different hallucinated, non-existent command every time — never the grounded
`kubectl rollout restart deploy/payments -n prod` from the Acme runbook. This directly contradicts the
page's own teaching claim two paragraphs later: "Aria... decides whether it needs to retrieve... This is
agentic RAG: the agent routes first, then acts," and the module ladder's M6 claim that the agent gives "a
grounded, guardrailed answer." Copy-pasting the page's exact question produces the opposite of what's
promised — a routing miss plus a hallucination, on the very question chosen to demonstrate grounding.
Judged by SHAPE per task rules: the *shape* itself (decision line + grounded command) does not match; this
is not a formatting nit.

**F2 — BLOCKER — Step 5's `kit pack`/`kit push` commands are not literally runnable; `<your-github-user>`
breaks in any POSIX shell via redirection.**
Page: capstone index, "Step 5 — Package the model (M4)". Commands as printed:
```
cd labs/m4
kit pack . -t ghcr.io/<your-github-user>/support-model:v1.0
kit push  ghcr.io/<your-github-user>/support-model:v1.0
```
Executed exactly as written (zsh, matching this course's stated shell):
```
(eval):4: no such file or directory: your-github-user
```
Root cause confirmed: the shell parses the bare `<your-github-user>` as input redirection from a file
named `your-github-user`, which doesn't exist, so the command aborts before `kit` even runs — for both
`kit pack` and `kit push`. Substituting a real value (e.g. `ghcr.io/gouravjshah/support-model:v1.0`, no
angle brackets) makes `kit pack` succeed cleanly (`Model saved: sha256:...`); `kit push` could not be
verified further as it requires real GHCR credentials, out of scope for this dry-run. Every other
placeholder-bearing command elsewhere in the course (e.g. M4's own lab, M8's GHCR push commands) should be
checked for the same `<...>` pattern — this is the first point in the capstone where it actually blocks
execution rather than being an obviously-a-placeholder narrative aside. Severity BLOCKER because "execute
exactly as written" fails outright, not just produces wrong output.

**F3 — CONFUSING — Step 6's `SEV:` field never matches the page's printed severity label.**
Page: capstone index, "Step 4 — Fire the Incident Crew (M7)". Expected output (abbreviated):
```
[TRIAGE]      AREA: payments | SEV: critical | ...
```
Got (verbatim, both runs):
```
[TRIAGE]      AREA: payments | SEV: 3 | Service is currently unavailable.
```
The Triage agent consistently emits a numeric severity (`SEV: 3`) rather than the word `critical` the page
shows. The rest of the crew pipeline shape matches well (see PASS note below) and the numeric value is a
reasonable proxy for "critical" on some unstated 1–5 scale, but a learner comparing terminal output to the
page verbatim will not find the string `critical` anywhere in real output — worth a footnote or an
"(examples; exact wording/severity scale will vary)" caveat, which the page doesn't have for this specific
field (M8's lab elsewhere in the course does use "(will vary)" language for scan counts — this page is
inconsistent with that convention).

**F4 — Not a course defect (network-conditional, root-caused) — Step 6's `secure-image.sh` never reaches
its final `Done.` line because `cosign sign` cannot reach `rekor.sigstore.dev` on this network.**
Page: capstone index, "Step 6 — Secure the crew image (M8)". Ran:
```
docker build -t acme-incident-crew:latest labs/m7/
cd labs/m8
./secure-image.sh acme-incident-crew:latest
```
Stages 1–3 (Syft SBOM, Trivy scan, Grype scan) completed and matched the page's Expected shape (SBOM
written; Trivy `Total: 23 (HIGH: 19, CRITICAL: 4)`; Grype table populated). Stage `[4/4] Sign with cosign`
failed:
```
Error: signing [...]: ... Post "https://rekor.sigstore.dev/api/v1/log/entries": tls: failed to verify
certificate: x509: certificate is valid for *.airtel.com, airtel.com, not rekor.sigstore.dev
```
Confirmed via direct `curl -v https://rekor.sigstore.dev`: this network presents a Bharti Airtel corporate
TLS-interception certificate for that host specifically. This is the identical root cause already
documented for M8's own lab (see that module's sweep report, F2/F3) — the capstone simply re-exposes the
same M8 gap by re-running the same script. Recorded here for completeness of the capstone's own
Expected-vs-Got, but attributed to network, not course content. The script's final
`Done. SBOM + scanned + signed ...` line never printed as a direct consequence.

**F5 — COSMETIC — no separate teardown step is printed for Step 6's side-effect `local-registry` container
or for the `capstone_chroma_data` volume.**
Page: capstone index. The only printed teardown instruction on the whole page is
`docker compose down`, placed *between* Step 4 and Step 5 (covering only `chromadb`/`genai-app`/
`agent`/`crew`, i.e. the compose-managed services). Step 6's `secure-image.sh` independently starts a
`local-registry` container (`docker run -d -p 5001:5000 --name local-registry registry:2`) as a side
effect of the M8 script it calls — the capstone page never mentions this container exists or needs
cleanup. Likewise the `capstone_chroma_data` named volume created in Step 2 is never mentioned again.
Both are low-cost (small image, small volume) but a learner working straight down the page ends the
capstone with two undocumented pieces of state on their machine.

---

## What matched well (not findings, worth recording)

- **Step 0** (`./platform-check.sh`) matched the page's Expected output almost exactly — same four
  sections, same green checkmarks, same final "PLATFORM READY" line (real output is slightly more granular
  in section 4, listing `syft`/`trivy`/`grype`/`cosign` as four separate lines vs. the page's one collapsed
  line — a cosmetic improvement, not a mismatch).
- **Step 2** (`docker compose up -d chromadb genai-app`) matched the page's Expected output verbatim,
  including the exact resource names (`Network capstone_default Created`, `Volume capstone_chroma_data
  Created`, `Container chromadb Started`, `Container genai-app Started`). Both containers reached healthy
  state; `genai-app` served HTTP 200 on :8501.
- **Step 4** (the Incident Crew) matched the page's Expected shape well on both runs: all four roles
  (Triage → Investigator → Fixer → Reviewer) fired, the Investigator and Fixer both surfaced the correct
  grounded command (`kubectl rollout restart deploy/payments -n prod`, pulled from the same runbook Step 3
  failed to retrieve), and the Reviewer consistently returned `APPROVED`. This is the page's strongest,
  most reliably-reproduced demonstration of the "arc of intelligence" claim — ironic given Step 3
  (the simpler, one-agent case) is the one that broke (F1).
- **Mid-lab teardown** (`docker compose down`, run after Step 4 as printed) worked cleanly — network,
  containers, all removed, exit 0.
- **Quiz page** renders correctly: 5 questions, all with the exact `prompt`/`options[].correct`/
  `explanation` shape the course convention specifies, 2 of 5 correctly marked `multiSelect` with a
  "(select all that apply)" hint. No blank-render issue.
- Pagination/module-hop is coherent: M8 quiz page's "Next" link points to the capstone page; the capstone
  page's "Next" link points to the capstone quiz. No dead links, no skipped module.
- `labs/capstone/README.md` and `labs/capstone/compose.yaml` both exist exactly where the page's `cd
  labs/capstone` instruction implies, with build contexts (`../m5/app`, `../m6`, `../m7`) all present and
  buildable from the M1–M8 end-state this sweep started from.

---

## Seam check (M8 → Capstone, and whole-course seam)

**Artifact/image dependency:** the capstone explicitly reuses cached artifacts from M5 (build context),
M6/M7 (build contexts + the `acme-support-agent`/`acme-incident-crew` image names), and M8 (`secure-
image.sh`, `security-pipeline.yml`) — it does not re-teach or re-derive any of them, correctly assuming the
learner completed M1–M8 in order. Every referenced path (`../m4`, `../m5/app`, `../m6`, `../m7`, `../m8`)
resolved on this machine's real M1–M8 end-state with no missing file, confirming the capstone is genuinely
built to run from the cumulative repo state modules 1–8 leave behind, not a separately-staged fixture.

**Does it tell you how to get missing artifacts?** Partially. Step 6 says "Build the crew image locally
first (**or reuse the one from M7**)" — a good explicit fallback. Step 5 (ModelKit) and Step 7 (CI push)
assume M4's `labs/m4/` directory and M8's `security-pipeline.yml` exist, which they do by this point, but
neither step says what to do if a learner skipped M4 or M3B — there's no "if this file is missing, go back
to M4" pointer anywhere on the page. Given the whole premise of a capstone is "you did all 8 modules," this
is a minor gap rather than a real problem for the intended audience.

**Module-hop navigation:** coherent, see PASS note above (M8 quiz → Capstone → Capstone quiz, no
skips or dead ends).

**Whole-course seam verdict:** the capstone is a genuine integration test — it is the first page in the
course that runs M5+M6+M7 against **one shared** ChromaDB (correctly solving the "port 8000 already in
use" problem that would occur if a learner just re-ran each module's own `compose.yaml` back to back,
which the page calls out explicitly and correctly). The one real functional break in that integration is
F1 — the M6 agent, wired into the shared platform, does not reproduce the routing/grounding behavior the
M6 module itself presumably demonstrated in isolation (out of scope for this sweep to re-verify against
the M6 module's own lab, but worth the author cross-checking against sweep-07-m6.md).

---

## Timing per section

| Section | Wall time |
|---|---|
| Step 0 (platform-check.sh) | ~1s |
| Step 1 (ollama serve check, curl) | ~2s |
| Step 2 (compose up chromadb + genai-app, cache warm) | ~6s to `Started`, ~15s to both healthy |
| Step 3 (agent one-shot, 3 runs incl. re-runs for F1) | ~5s per run |
| Step 4 (crew one-shot, 2 runs) | ~5s per run |
| Mid-lab teardown (`docker compose down`) | ~2s |
| Step 5 (kit pack, after fixing placeholder) | ~7s; `kit push` not completed, no registry creds |
| Step 6 (docker build, cache warm + secure-image.sh through failure) | build ~1s (cached); script ~15s to stage 4 failure |
| Step 7 (no runnable command — CI narrative only) | n/a |
| Final teardown (this sweep's own cleanup of `local-registry`) | ~1s |

Total hands-on time: roughly 8–10 minutes including three re-runs of Step 3 to confirm F1 was
reproducible rather than one-off model noise.

---

## Machine-local observations (facts, not findings)

- `docker` at `~/.rd/bin/docker`; PATH prefix (`PATH="$HOME/.rd/bin:$PATH"`) sufficient for all `docker`/
  `docker compose` invocations in this sweep.
- rtk hook mangled several plain commands mid-sweep: `docker ps -a` (`error: unexpected argument '-a'
  found`), `rg -o`/`rg -n` (`Usage: rtk grep [OPTIONS]...`), plain `grep -n` similarly. Worked around by
  prefixing with `command` (e.g. `command grep`, `command docker`) or using Python's `re` module directly.
  Not a course issue — purely this session's shell tooling.
- `curl` piped through the rtk hook also silently reformatted real JSON (`curl .../v1/models`) into an
  abstract type-schema summary instead of returning the actual response body; `command curl` returned the
  real JSON. Flagging as a machine note since a real learner's shell wouldn't have this, but worth knowing
  if this transcript's tool-call outputs are ever compared against a learner's real terminal.
- Confirmed **zero course containers running** before Step 2's bring-up, per the task's explicit
  pre-flight requirement — checked via `docker ps -a | grep -iE 'm2-client|vllm|m5-genai|acme|chroma|
  registry|capstone|genai-app'` (no matches) immediately before starting.
- `docker stats` at pre-flight showed the five running author containers using well under 1.5 GB combined
  (opsmate-app 82MB, gateway-litellm-1 651MB, gateway-pg-1 40MB, gateway-analyzer-1 741MB,
  gateway-anonymizer-1 70MB) — none of this sweep's health states or timings appeared attributable to
  memory pressure from them; no service went unhealthy during this sweep for any reason other than F4's
  network-level TLS interception. `gateway-anonymizer-1` was already showing `(unhealthy)` in `docker ps`
  before this sweep started and throughout — pre-existing, unrelated to capstone work, untouched per
  instructions.
- **F2's root shell-redirection issue and F4's TLS-interception issue are both re-occurrences of gaps
  already logged against M4 and M8 individually** (this machine's `/var/run/docker.sock` is a stale
  symlink to a dead Docker-Desktop path, `~/.docker/run/docker.sock`, left over from a prior Docker Desktop
  install — confirmed via `ls -la`; this made `syft`'s direct-socket probe fail until `DOCKER_HOST` was
  exported explicitly, same as the already-documented M8 finding). Not new machine facts, but confirms
  they reproduce identically when hit via the capstone's re-use of the same underlying scripts.
- Sitemap.xml served under `initcron.github.io` advertises `schoolofdevops.github.io` as canonical
  (see note under Verdict). Purely an SEO/deployment-config detail, does not affect any tested page's
  actual content or functionality.

---

## Final machine state (after following the page's printed teardown exactly, plus this sweep's own cleanup of undocumented side effects)

- **Printed teardown followed exactly:** `docker compose down` (run once, between Steps 4 and 5, exactly
  where the page places it) — removed `chromadb`, `genai-app` containers and the `capstone_default`
  network cleanly (exit 0). Confirmed via `docker ps -a` immediately after: no `chromadb`/`genai-app`/
  `capstone-agent-run-*`/`capstone-crew-run-*` containers remain.
- **capstone_chroma_data volume:** left in place — the page's printed teardown never mentions removing it
  (see F5), so per "follow the printed teardown exactly" this sweep did not remove it either. Present at
  session end.
- **local-registry container (Step 6 side effect, undocumented on the page — see F5):** stopped and
  removed by this sweep as basic hygiene after confirming the page has no further instructions for it (the
  page's only teardown line comes *before* Step 6 runs). `docker stop local-registry && docker rm
  local-registry`, both succeeded.
- **Images left cached (all pre-existing or expected side effects, no course defect):** rebuilt
  `acme-incident-crew:latest` (same content, from Step 6's `docker build`) plus a new
  `localhost:5001/acme-incident-crew:latest` tag created by `secure-image.sh`'s local-registry push before
  it failed at the cosign stage. `registry:2` remains cached (was already cached pre-sweep).
- **cosign.key / cosign.pub / sbom.spdx.json:** generated in `labs/m8/` by `secure-image.sh`; the page's
  capstone teardown section does not mention these (they belong to M8's own lab/teardown, out of scope for
  this page) — left as-is, consistent with record-don't-fix and with "follow the printed teardown exactly."
- **No new course containers running** at final check. Only the five pre-existing unrelated author
  containers remain: `opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`, `gateway-analyzer-1`,
  `gateway-anonymizer-1` — untouched throughout, as instructed. Two long-exited unrelated containers
  (`gracious_haibt`, `hub-dev-postgres`) also untouched.
- `m7_chroma_data` volume: present, untouched (pre-existing, unrelated to this sweep's `capstone_
  chroma_data`).
- Port 5001 (`local-registry`): free again after this sweep's cleanup.
- Real project repo (`/Users/gshah/work/apps/learning/303-containerai`) confirmed unmodified by this sweep
  except for this report file — no course file (lesson, lab, compose.yaml, script) was edited, consistent
  with the record-don't-fix mandate. All command execution happened against the scratchpad clone at
  `/private/tmp/.../scratchpad/303-containerai`, matched to `origin/main` at commit `8ee46fc9`.
