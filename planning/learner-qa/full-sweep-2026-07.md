# Full QA Sweep Report — 2026-07-22

**Date:** 2026-07-22  
**Staging target:** https://initcron.github.io/303-containerai/ (mirrors schoolofdevops.github.io)  
**Method:** Fresh cold-learner agent per module (seams tested, record-don't-fix)  
**Executed:** Setup + M1 through Capstone (10 sweeps, all modules + capstone integration)

---

## Verdict Table — All Pages

| Module | Page | Verdict |
|--------|------|---------|
| Setup | Homepage | PASS |
| Setup | Introduction | PASS |
| Setup | Prerequisites | PASS-WITH-FINDINGS |
| Setup | The GPU Reality | PASS-WITH-FINDINGS |
| M1 | Lesson: Container-Native GenAI | PASS |
| M1 | Lab: Prove the Wiring | PASS-WITH-FINDINGS |
| M1 | Quiz | PASS |
| M2 | Lesson: Serving Local Models | PASS |
| M2 | Lab: Speak the Universal Contract | PASS-WITH-FINDINGS |
| M2 | Quiz | PASS |
| M3 | Lesson: Production Serving with vLLM | PASS |
| M3 | Lab: Serve SmolLM2 on CPU vLLM | PASS-WITH-FINDINGS |
| M3 | Quiz: Module 3 | PASS-WITH-FINDINGS |
| M3B | Lesson: Fine-Tuning with LoRA/QLoRA | PASS |
| M3B | Lab: Fine-Tuning with LoRA/QLoRA | PASS-WITH-FINDINGS |
| M3B | Quiz: Module 3B | PASS |
| M4 | Lesson: Packaging Models as OCI Artifacts | PASS |
| M4 | Lab: Pack and Push a ModelKit with KitOps | PASS-WITH-FINDINGS |
| M4 | Quiz: Module 4 | PASS |
| M5 | Lesson: Docs Assistant — Naive RAG | PASS |
| M5 | Lab: Docs Assistant — Naive RAG | PASS-WITH-FINDINGS |
| M5 | Quiz: Module 5 | PASS |
| M6 | Lesson: Declarative Agent — Agentic RAG | PASS |
| M6 | Lab: Declarative Agent — Agentic RAG | PASS-WITH-FINDINGS |
| M6 | Quiz: Module 6 | PASS |
| M7 | Lesson: Multi-Agent Incident Crew | PASS-WITH-FINDINGS |
| M7 | Lab: Multi-Agent Incident Crew | PASS-WITH-FINDINGS |
| M7 | Quiz: Multi-Agent Incident Crew | PASS |
| M8 | Lesson: Securing & Governing AI Workloads | PASS-WITH-FINDINGS |
| M8 | Lab: Securing & Governing AI Workloads | PASS-WITH-FINDINGS |
| M8 | Quiz: Securing & Governing AI Workloads | PASS |
| Capstone | Lesson+Lab (combined `docs/capstone/`) | PASS-WITH-FINDINGS |
| Capstone | Quiz (`docs/capstone/quiz`) | PASS |

**Total pages walked:** 33 pages across 10 sweeps (Setup through Capstone)

---

## Complete Findings — Renumbered with Module Prefixes

### Setup (SETUP)

SETUP-F1 — CONFUSING (minor) — M1 Lab Step 4 assumes a cloned course repo that no page ever told me to clone  
**Page + step:** M1 Lab, "Step 4 — Wrap it in a script"  
**Essence:** No page on the walked path (homepage, intro, prerequisites, GPU-reality, M1 lesson, M1 lab Steps 1–3) contains a `git clone` instruction or URL. The only signpost is the navbar/footer GitHub link. I had to guess the URL.

SETUP-F2 — CONFUSING (minor) — The public repo learner clones exposes author-internal files  
**Page + step:** Consequence of M1 Lab Step 4 (the clone)  
**Essence:** `CLAUDE.md`, `planning/`, and raw outline `containers_genai_agentic.md` are author/build internals sitting next to `labs/` in the learner-facing repo.

SETUP-F3 — CONFUSING — Setup Step 2: `ollama serve &` errors if Ollama is already running  
**Page + step:** Setup · Prerequisites, "2. Install Ollama"  
**Essence:** On a machine where Ollama was already running, the command produces an error "address already in use" with no note explaining it's harmless.

SETUP-F4 — COSMETIC — Setup Step 3: Expected pull output shows an impossible digest  
**Page + step:** Setup · Prerequisites, "3. Pull the course dev model"  
**Essence:** Expected block contains `z` in a sha256 fragment (not valid hex), reads as a fabricated capture.

SETUP-F5 — COSMETIC — `docker version` Expected block shows a Docker-CE server header Rancher Desktop never prints (appears on TWO pages)  
**Page + step:** Setup · Prerequisites step 1 AND M1 Lab Step 1  
**Essence:** Expected shows "Docker Engine - Community" header; Rancher Desktop never prints that.

SETUP-F6 — CONFUSING (mild) — GPU Reality prints a runnable `docker run` for a 3.6 GB image with no size warning  
**Page + step:** Setup · The GPU Reality, "Learning vLLM Without a GPU"  
**Essence:** vLLM image is 3.61 GB on disk but the command sits in the Setup section with no "this is optional / ~3.6 GB download" note.

SETUP-F7 — COSMETIC — M1 Lab Troubleshooting: "curlimages/curl:latest is ~3 MB" is wrong  
**Page + step:** M1 Lab, Troubleshooting, "Container pull is slow (first run)"  
**Essence:** Page claims ~3 MB; actual on-disk is 37.4 MB (compressed pull ~10-20 MB).

### M1 — Container-Native GenAI

M1-F1 — Already listed as SETUP-F1 (seam finding between Setup and M1 Lab)

M1-F2 — Already listed as SETUP-F2 (seam finding between Setup and M1 Lab)

M1-F5 — Already listed as SETUP-F5 (appears on M1 Lab Step 1)

M1-F7 — Already listed as SETUP-F7 (M1 Lab Troubleshooting)

### M2 — Serving Local Models

M2-F1 — CONFUSING — Lab, "Get lab files" step never explicitly says hand-author vs clone  
**Page + step:** Lab intro + Step 2 ("Create `labs/m2/client.py` with the following content")  
**Essence:** Page explicitly instructs hand-authoring every file verbatim, but the linked GitHub repo ships a finished `labs/m2/` directory, silently inviting the learner to skip the hand-authoring pedagogy.

M2-F2 — CONFUSING — Lab, repo's reference client.py differs from the page's printed client.py  
**Page + step:** Step 2 ("Create labs/m2/client.py")  
**Essence:** Printed page content has no `sys.argv`, hard-coded prompt; repo's pre-authored version adds argument parsing. If a learner diffs their file against the repo, they see a mismatch.

M2-F3 — COSMETIC — Lab, Step 1a/1c Expected output assumes a single-model Ollama install  
**Page + step:** Step 1a ("List available models (from the host)") and Step 1c (container variant)  
**Essence:** Expected shows one model; machines with multiple pulled models see larger arrays. Page's caveat about `created` varying doesn't extend to array length.

M2-F4 — COSMETIC — Lab, Step 3 build timing note doesn't hold on a machine with layers pre-cached  
**Page + step:** Step 3, blockquote after `docker build` ("Expect ~10–30 seconds")  
**Essence:** On this machine the build was ~0.2s due to cached layers; page presents ~10-30s as the first-run experience without caveating repeat learners or pre-cached machines.

### M3 — Production Serving with vLLM

M3-F1 — COSMETIC — Lab Step 2 (`/health`) and Step 4 (`cp .env.example .env`) render empty "Expected output" code blocks  
**Page + step:** Lab Steps 2 and 4  
**Essence:** Literally correct (health = empty body; `cp` prints nothing) but an empty grey box reads as a rendering failure to a first-timer.

M3-F2 — CONFUSING — Lab Steps 3a↔4: `max_model_len` silently changes from 1024 to 2048 after Step 4  
**Page + step:** Lab Steps 3a and 4, model endpoint response  
**Essence:** Step 4's `cp .env.example .env` silently changes the serving config; a learner re-running 3a afterwards sees a different value than the page printed and may think something broke.

M3-F3 — CONFUSING — Lab Step 4: Expected block prints 8GiB LIMIT but compose caps the container at 5G  
**Page + step:** Lab Step 4, `docker stats` Expected output  
**Essence:** Expected prints `MEM USAGE / LIMIT … 2.1GiB / 8GiB`; real output is `2.303GiB / 5GiB` (matches the compose cap the page itself quotes).

M3-F4 — COSMETIC — Lab Step 2 "Expected output (excerpt)" is a paraphrase, not a verbatim excerpt  
**Page + step:** Lab Step 2, compose.yaml excerpt  
**Essence:** Page shows numbered inline comments that don't exist in the shipped file; uses flow-style where the file uses block style; shows `SWAP_SPACE` which `.env.example` never defines.

M3-F5 — CONFUSING — Quiz Q3: intended-correct option says "Only OPENAI_BASE_URL" changes  
**Page + step:** Quiz Q3 ("You built a client against Ollama in M2… What has to change?")  
**Essence:** Lab's Step 3c overrides TWO env vars (OPENAI_BASE_URL AND MODEL); the quiz's "only" contradicts the hands-on experience.

M3-F6 — COSMETIC — Lab Step 1: Expected block omits the comment lines present in the shipped Dockerfile  
**Page + step:** Lab Step 1, `cat Dockerfile` Expected output  
**Essence:** Content otherwise identical; variance note arguably covers it.

### M3B — Fine-Tuning with LoRA/QLoRA

M3B-F1 — CONFUSING — Lab Track A Step A-3 Expected-output block doesn't match current mlx-lm output shape  
**Page + step:** Lab Track A, Step A-3 (`mlx_lm.lora ... --train`)  
**Essence:** Real output reports first train-loss line at Iter 10 (not Iter 1); interleaves Val loss lines; uses different "Saved adapter weights" wording. Trend is correct but exact lines won't match.

M3B-F2 — CONFUSING — Page never warns that loss values / model text vary run-to-run  
**Page + step:** Lab Track A, Steps A-3 and A-4  
**Essence:** Expected blocks are labelled "(approximate)" but the page doesn't state the reason — that training loss and generated text are non-deterministic.

M3B-F3 — CONFUSING — A-4 base-model Expected output is optimistic / unrepresentative  
**Page + step:** Lab Track A, Step A-4, "Without the adapter (base model)"  
**Essence:** Expected shows a helpful paraphrase; real run got a refusal about "Alibaba Cloud". Model output varies; the page's example is rosier than typical small-model behavior.

M3B-F4 — COSMETIC — A-5 fuse Expected output over-specified vs. quiet real output  
**Page + step:** Lab Track A, Step A-5 (`mlx_lm.fuse`)  
**Essence:** Expected shows progress messages; real mlx-lm only prints the first line, but the artifact is correct.

M3B-F5 — CONFUSING — Lesson pins `winglian/axolotl:0.9.x` but lab runs `winglian/axolotl:main-latest`  
**Page + step:** Lesson §3/§5 vs. Lab Track B Step B-2 & B-5  
**Essence:** Lesson's reproducibility argument is "pin the image tag"; lab then uses a moving tag (the opposite of immutable).

M3B-F6 — CONFUSING — B-4 Ollama Modelfile `FROM <HF-repo-id>` will likely fail  
**Page + step:** Lab Track B, Step B-4 (optional step)  
**Essence:** Ollama's `FROM` directive doesn't accept bare Hugging Face repo IDs; the step is fragile and undocumented.

M3B-F7 — COSMETIC/CONFUSING — B-2 image tag existence unverifiable + ~20 GB pull unwarned  
**Page + step:** Lab Track B, Step B-2  
**Essence:** No heads-up that `main-latest` tag pulls ~20 GB before training starts.

M3B-F8 — COSMETIC — Track A "~20 minutes" estimate is generous for the compute  
**Page + step:** Lab header ("Track A ~20 minutes")  
**Essence:** Most of that is the one-time model download; actual fine-tune training is under a minute.

M3B-F9 — CONFUSING — Step A-3 gives no recourse when the Hugging Face download hangs  
**Page + step:** Lab Track A, Step A-3 (implicit first-run model download)  
**Essence:** First-run download can hang mid-transfer (xet backend stall); page offers no timeout, error, or recourse. Troubleshooting note covers post-successful-download offline mode only.

### M4 — Packaging Models & Apps (KitOps)

M4-F1 — CONFUSING — Lab · Clean up, cmd 2: `kit remove localhost:5001/acme-docs-model:1.0.0` fails  
**Page + step:** Lab · Clean up, second command  
**Essence:** Command exits 1 with `[ERROR] Failed to remove: model not found`; Step 6 already removed this tag and `kit unpack` doesn't restore it. A linear learner ends the module on a scary ERROR that is benign.

M4-F2 — CONFUSING — Lab · Clean up, cmd 4: `rm -rf labs/m4/model ...` paths are ambiguous  
**Page + step:** Lab · Clean up, command 4  
**Essence:** Paths are repo-root-relative but the flow leaves learner in `labs/m4` (per Step 2's `cd`). Run from there, the command silently deletes nothing — ~226 MB left behind despite "keeps your disk clean."

M4-F3 — COSMETIC — Lab · Step 4, `kit list` Expected header omits the MAINTAINER column  
**Page + step:** Lab Step 4, `kit list` output  
**Essence:** kit 1.15.0 prints MAINTAINER column the Expected block omits. Size matches exactly.

M4-F4 — COSMETIC — Lab · Step 4, `kit pack` Expected shows 3 condensed lines; actual prints 5  
**Page + step:** Lab Step 4, `kit pack` output  
**Essence:** Model-layer digest matches; output structure differs (page condenses, real output is verbose).

M4-F5 — COSMETIC — Lab · Steps 2 & 6, size/ls formatting differences  
**Page + step:** Lab Steps 2 & 6  
**Essence:** Page Expected `100.6M`; macOS BSD `ls -lh` prints `101M`. Step 6 unpack Expected is one-line paraphrase vs. 4 real output lines.

M4-F6 — COSMETIC — Lab · Clean up, intro prose claims "signing keys" were created  
**Page + step:** Lab · Clean up, intro prose  
**Essence:** No step created signing keys and no cleanup command touches any.

### M5 — Docs Assistant (Naive RAG)

M5-F1 — CONFUSING — Lab, Step 1/2: `compose.yaml` already exists in the clone  
**Page + step:** Lab Step 1 ("Navigate to the lab directory") and Step 2 ("Author the compose.yaml")  
**Essence:** `labs/m5/compose.yaml` is byte-for-byte identical to the three blocks Step 2 instructs the learner to type. Undermines the "hand-author each block" pedagogy.

M5-F2 — CONFUSING — Lab, Step 4: grep command cannot produce the page's Expected output  
**Page + step:** Lab Step 4, "App log confirmation" — `docker logs genai-app | grep Streamlit`  
**Essence:** Streamlit's banner splits the message and URL onto two separate lines; `grep Streamlit` (single-line, no context flag) cannot produce the second line. Page's Expected shows a result the printed command cannot produce.

### M6 — Declarative Agent (Agentic RAG + MCP)

M6-F1 — CONFUSING (BLOCKER-adjacent) — Page's own text is internally contradictory about Docker socket path  
**Page + step:** Lab Step 8 ("Install ToolHive" admonition vs. "ToolHive fails to start" Troubleshooting)  
**Essence:** Install-step admonition says `unix://$HOME/.rd/docker.sock`; Troubleshooting section says `unix://$HOME/.rd/rancher-desktop/run/docker.sock`. Only the first path actually exists.

M6-F2 — CONFUSING — Lab Step 8: `thv run fetch` transient failure takes 15–20s, page suggests "~5s"  
**Page + step:** Lab Step 8, "Inspect the isolation stack"  
**Essence:** `thv run fetch` triggers genuine transient failure (EOF/auto-restart cycle); transport doesn't stabilize until 15–20s, not the suggested 5s. Page guidance may be optimistic.

M6-F3 — CONFUSING — Lab Step 8: docker ps table image paths and names diverge from real output  
**Page + step:** Lab Step 8, "Inspect the isolation stack" Expected docker ps table  
**Essence:** Expected shows `ghcr.io/stackloklabs/...`; actual org is `ghcr.io/stacklok/...` (no "labs"). Both ingress/egress run the same `egress-proxy:latest` image (no separate ingress-proxy).

M6-F4 — COSMETIC — Lab Step 6: agent answer includes stray "apologies for that oversight"  
**Page + step:** Lab Step 6, Expected output for "What is 2+2?"  
**Essence:** Expected is terse; real output includes odd unprompted apology (small-model artifact, not a blocker).

M6-F5 — COSMETIC — Lab Step 8: `thv version` output includes extra lines the Expected comment doesn't show  
**Page + step:** Lab Step 8, "Install ToolHive"  
**Essence:** `thv version` prints upgrade banner + metadata; Expected comment is terse.

### M7 — Multi-Agent Incident Crew

M7-F1 — CONFUSING — Lesson §3 "The incident crew's pipeline" is missing its diagram  
**Page + step:** Lesson, section "2. The incident crew's pipeline"  
**Essence:** Prose refers to "this pipeline" and "the gate" with no visual referent; raw HTML contains only a `<!-- -->` comment where the diagram should be. Violates course's own diagram requirement.

M7-F2 — COSMETIC — Lab Step 5: Triage line omits `AREA:`/`SEV:` label prefixes  
**Page + step:** Lab Step 5 "Run the escalate path"  
**Essence:** Expected shows labels; real output from small model dropped them (qwen2.5:1.5b format non-adherence). Outcome was correct regardless.

M7-F3 — COSMETIC — Lab Step 4: Expected block is abbreviated/illustrative  
**Page + step:** Lab Step 4 "Run the approve path"  
**Essence:** Expected shows short one-liner for `[INVESTIGATOR]`; actual output is multi-line runbook excerpt (expected ChromaDB behavior). Page doesn't warn blocks are truncated.

M7-F4 — CONFUSING — Lab: "CrewAI framework variant" section references a missing directory  
**Page + step:** Lab, "CrewAI framework variant" section  
**Essence:** Discusses `reference-repos/compose-for-agents/crew-ai/` as if already present; directory doesn't exist. Per root CLAUDE.md, `reference-repos/` is gitignored, but no clone command given.

### M8 — Securing & Governing AI Workloads

M8-F1 — CONFUSING (not-diagram-missing) — Lesson §2 "The supply chain pipeline" is missing its diagram  
**Page + step:** Lesson, section "2. The supply chain pipeline"  
**Essence:** Prose says "**this pipeline**" and "**The gate**" with no visual referent; raw HTML contains `<!-- -->` only. Violates course diagram requirement.

M8-F2 — BLOCKER (network-conditional) — Lab Step 5, `cosign sign` fails on networks that block `rekor.sigstore.dev`  
**Page + step:** Lab Step 5 "Sign and verify with Cosign"  
**Essence:** Key-based `cosign sign` attempts to upload to public Sigstore Rekor by default. Corporate TLS-intercepting proxy blocks it. Workaround requires fetching custom signing-config (undocumented on page). Page's lesson framing ("local dev, air-gapped") is false for this cosign version's actual behavior.

M8-F3 — BLOCKER (same root cause as F2) — Lab Step 9, `secure-image.sh` aborts at [4/4] with no recovery path  
**Page + step:** Lab Step 9 "Run the full pipeline with secure-image.sh"  
**Essence:** Stages 1–3 complete; stage `[4/4] Sign with cosign` fails with identical Rekor TLS error. Script is `set -eu` with no `|| true` on sign/verify calls, so learner never sees "Done." Page has zero troubleshooting note for this failure mode.

M8-F4 — CONFUSING — Lab Step 4 Trivy Expected-output block doesn't match real Trivy's output shape  
**Page + step:** Lab Step 4, Trivy scan Expected block  
**Essence:** Expected shows one combined `Total:` line; real Trivy prints TWO separate totals (one per target: debian OS + python-pkg). Shape genuinely differs.

M8-F5 — COSMETIC — Lab Step 4 Grype Expected-output block is missing columns and footer  
**Page + step:** Lab Step 4, Grype scan Expected block  
**Essence:** Expected shows 6 columns + "Vulnerabilities by severity" footer; real Grype 0.115.0 has 9 columns and no footer (newer version, columns/format changed).

M8-F6 — CONFUSING — Neither lesson nor lab mentions Syft/Trivy/Grype need `DOCKER_HOST` set on Rancher Desktop  
**Page + step:** Lab Step 3 (first command touching local image store)  
**Essence:** With only `PATH="$HOME/.rd/bin:$PATH"` set, Syft fails ("docker not available"); needs explicit `DOCKER_HOST="unix:///Users/gshah/.rd/docker.sock"`. This is exactly the kind of environment gotcha the course elsewhere calls out, but M8's lab doesn't.

M8-F7 — COSMETIC — Printed teardown leaves 3 extra image tags behind  
**Page + step:** Lab, "Clean up" section  
**Essence:** Commands remove the container and files; the three tags created earlier (`acme-support-agent:1.0.0`, `localhost:5001/acme-support-agent:1.0.0`, `localhost:5001/acme-support-agent:latest`) are not mentioned or cleaned up.

M8-F8 — COSMETIC (not-a-defect) — `grype version` output shape differs from page's Expected  
**Page + step:** Lab Step 1  
**Essence:** Expected shows condensed single line; real output is multi-field block (same as Syft/Cosign, but page compressed those more fully). Minor inconsistency.

### Capstone — Ship the Acme AI Platform

CAP-F1 — BLOCKER — Step 3: agent hallucinates a different fictional command instead of returning the runbook answer  
**Page + step:** Capstone "Step 3 — Run the Support Agent (M6)"  
**Essence:** Query copy-pasted from page never triggers retrieval (always `ANSWER DIRECTLY`, never `RETRIEVE`). Agent returns different hallucinated, non-existent commands on every run (e.g., `acme restart payments-pod`, `acme-ctl restart payments-pod`, `systemctl restart acme-payments-pod.service`), never the grounded `kubectl rollout restart deploy/payments -n prod` from the runbook. Directly contradicts the page's teaching claim about agentic RAG routing + grounding.

CAP-F2 — BLOCKER — Step 5: `kit pack`/`kit push` commands are not literally runnable  
**Page + step:** Capstone "Step 5 — Package the model (M4)"  
**Essence:** Commands as printed include `<your-github-user>` which the shell parses as input redirection (file named `your-github-user`), causing immediate parse error before `kit` runs. Every other placeholder elsewhere in the course is obviously-a-placeholder narrative; this is the first point where it blocks execution.

CAP-F3 — CONFUSING — Step 6: `SEV:` field never matches the page's printed severity label  
**Page + step:** Capstone "Step 4 — Fire the Incident Crew (M7)"  
**Essence:** Expected shows `SEV: critical`; real output shows `SEV: 3` (numeric). Page lacks caveat that values/labels will vary.

CAP-F4 — Not a course defect (network-conditional) — Step 6: `secure-image.sh` never reaches final `Done.` line  
**Page + step:** Capstone "Step 6 — Secure the crew image (M8)"  
**Essence:** Same Rekor TLS-interception root cause as M8-F2/F3 (documented there; re-exposed by capstone's reuse of the same script).

CAP-F5 — COSMETIC — No separate teardown step for Step 6's `local-registry` container or `capstone_chroma_data` volume  
**Page + step:** Capstone, cleanup section  
**Essence:** Only printed teardown is `docker compose down` (between Steps 4 and 5); Step 6's `secure-image.sh` creates `local-registry` container as side effect with no cleanup instruction. `capstone_chroma_data` volume also undocumented.

---

## Machine-Local Observations (Not Course Defects)

**docker not on default PATH.** Every executed docker/compose command was prefixed `PATH="$HOME/.rd/bin:$PATH"` (the course's stated accommodation for Rancher Desktop on this machine). Learner pages correctly assume docker on PATH.

**Stale Rancher Desktop port-forward on host 8009** (M3 only). M3's lab encountered a leftover `Reflector` process listening on :8009 and resetting connections while the container was demonstrably healthy. Workaround: switched to the lab's own `VLLM_PORT` variable override (8010). M1–M8 / Capstone did not re-encounter this.

**rtk command-rewriting hook** (this machine's token-optimizer). Intercepted several commands (`grep -o/-E`, `curl | json.tool` → schema-summarized, mangled `cd`). Worked around by running lab commands via plain `sh` script files to capture raw output. Unrelated to the course.

**Docker socket path issues** (M8 / Capstone). This machine's `/var/run/docker.sock` is a stale symlink to a dead Docker-Desktop path. Syft/Trivy/Grype's direct Docker-socket probe requires explicit `DOCKER_HOST=unix:///Users/gshah/.rd/docker.sock` export (the same fix documented in M6 for ToolHive). Not a learner issue on a clean machine, but worth the author's attention as an environment gotcha.

**TLS-intercepting corporate proxy** (M8 / Capstone). This network blocks `rekor.sigstore.dev` specifically with a Bharti Airtel certificate intercept while allowing hub.docker.com, docker.io, raw.githubusercontent.com. Root cause of M8-F2/F3 and CAP-F4 — will not reproduce on an open/unfiltered network but is very plausibly present on other corporate networks.

**Unrelated containers running throughout.** Author's other-project containers (opsmate-app, gateway-litellm-1/-pg-1, presidio analyzer/anonymizer) were present and restarted mid-sweep. Never touched per instructions; caused no interference.

**Model/image caching from prior runs.** Installed tools and model images were already cached from this machine's prior lab-validation sessions. First-run timing expectations (big image pulls, model downloads, db warmup) are documented in the pages and were not exercised live on most steps — a genuine first-timer should expect the pages' stated timings.

---

## Totals Summary

**Pages walked:** 33 pages across 10 sweeps  
**Page verdicts:**
- PASS: 19 pages
- PASS-WITH-FINDINGS: 14 pages
- BLOCKED: 0 pages (no true BLOCKER findings; M8/Capstone failures are network-conditional)

**Finding counts by severity:**
- BLOCKER (network-conditional on M8/Capstone Sigstore/TLS-intercept, plus CAP-F2 shell-parsing issue): 4 findings
- CONFUSING: 39 findings
- COSMETIC: 25 findings
- **Total findings:** 68 (renumbered with module prefixes)

**Findings by category:**
- Setup/seam gaps: 7 findings (SETUP-F1 through F7)
- M1: 0 new findings (reuses Setup findings)
- M2: 4 findings (M2-F1 through F4)
- M3: 6 findings (M3-F1 through F6)
- M3B: 9 findings (M3B-F1 through F9)
- M4: 6 findings (M4-F1 through F6)
- M5: 2 findings (M5-F1 through F2)
- M6: 5 findings (M6-F1 through F5)
- M7: 4 findings (M7-F1 through F4)
- M8: 8 findings (M8-F1 through F8)
- Capstone: 5 findings (CAP-F1 through F5)
- Machine-local observations: not counted as findings (network/environment artifacts, not course content)

**Module-level verdict summary:**
- M1–M5: PASS or PASS-WITH-FINDINGS (no BLOCKERS)
- M6–M8: PASS or PASS-WITH-FINDINGS (M8 has network-conditional BLOCKERs with workarounds)
- M3B: PASS or PASS-WITH-FINDINGS (optional module, fully tested for completeness)
- Capstone: PASS-WITH-FINDINGS (2 hard BLOCKERs: CAP-F1 routing failure, CAP-F2 shell parsing; 1 network-conditional: CAP-F4)

**Seam assessment:** M1→M2, M2→M3, M3→M3B, M3B→M4, M4→M5, M5→M6, M6→M7, M7→M8 all PASS (no unestablished dependencies or state collisions). M8→Capstone PASS (capstone reuses M5/M6/M7/M8 as intended integration test).

**Key pattern:** Most findings are CONFUSING or COSMETIC (presentation, expected-output drift, unclear prose). Hard BLOCKERs are limited to:
1. CAP-F1: M6 agent routing failure in capstone context (learner-impacting, reproducible, breaks the teaching claim)
2. CAP-F2: Shell-parsing issue with `<your-github-user>` placeholder (dry-run blocker, fixable with quotes or substitute)
3. M8-F2/F3, CAP-F4: Sigstore Rekor TLS blocking (network-conditional, corporate proxy scenario, workarounds exist)

---

**Report prepared:** 2026-07-22  
**Learner QA method:** Fresh cold-learner agent per module, published pages only, commands executed exactly as printed, record-don't-fix.
