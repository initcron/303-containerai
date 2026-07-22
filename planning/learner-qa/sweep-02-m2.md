# Learner-QA Sweep 02 — M2 · Serving Local Models

- **Date:** 2026-07-22
- **Tester role:** first-time learner, published pages only (https://initcron.github.io/303-containerai/), commands executed exactly as printed, record-don't-fix.
- **Machine:** arm64 Mac, Rancher Desktop (docker server 29.5.2, `~/.rd/bin/docker`), Ollama already serving natively on `:11434` from M1's end-state (M1 left nothing running — no containers, no compose networks). `qwen2.5:1.5b` already pulled.
- **Lab source:** fresh clone of `https://github.com/schoolofdevops/303-containerai.git` into scratchpad (`303-containerai-m2-clone/`), used only for the `labs/m2/` working directory — file *content* was hand-authored verbatim from the page text, not copied from the repo's pre-existing reference files (see Finding F1).

## Scope — pages read, in sidebar order

1. Lesson — https://initcron.github.io/303-containerai/docs/m2-serving/lesson
2. Lab — https://initcron.github.io/303-containerai/docs/m2-serving/lab ("Lab: Speak the Universal Contract")
3. Quiz — https://initcron.github.io/303-containerai/docs/m2-serving/quiz

(No deep-dive page exists for M2 — sidebar under `m2-serving/` has exactly these three routes.)

## Verdict per page

| Page | Verdict | Rationale |
|---|---|---|
| Lesson | **PASS** | Clear, well-structured, analogies present (espresso machines, wall socket, JPEG compression), tables render correctly, no diagram needed given the content is contract/table-driven, no dead links. |
| Lab | **PASS-WITH-FINDINGS** | Every executable step ran successfully and matched Expected output in shape; findings are about missing repo-vs-hand-author guidance and one Expected-output block that will visibly disagree with real output on any machine with more than one Ollama model pulled. |
| Quiz | **PASS** | Renders, questions map directly to lesson/lab concepts (engine list, seam-swap file impact, endpoint shape, host.docker.internal vs service-name, dummy api_key rationale). No structural issues observed. |

## Numbered findings

**F1 — CONFUSING — Lab, "Get lab files" step (page never actually says this)**
Page/step: Lab intro + Step 2 ("Create `labs/m2/client.py` with the following content").
Command run: none (this is a documentation-structure finding).
Expected: The page's only path to lab files is "Create labs/m2/client.py ... Dockerfile ... compose.yaml" — i.e., it explicitly instructs the learner to hand-author every file from the printed content, service by service, per the course's own stated authoring philosophy ("You author it service by service so you understand every block").
Got: The linked GitHub repo (`schoolofdevops/303-containerai`, the only repo link on the site) already ships a **finished** `labs/m2/` directory (`client.py`, `Dockerfile`, `compose.yaml`, plus a `README.md` not referenced anywhere on the page) with working code. A learner who clones the repo to "get the lab files" (a completely reasonable interpretation given the GitHub link is the only external resource the site offers) will find the exercise already done for them — undermining the "hand-author each block" pedagogy the lesson/lab explicitly calls out. The page never clarifies whether cloning is expected, forbidden, or irrelevant; it also never mentions the repo at all in the lab body (only via the site-wide nav GitHub link).
Severity: CONFUSING — does not block the lab (a learner who trusts the page text can still hand-type the three files and succeed, which is what I did), but it silently invites a shortcut that defeats the module's stated purpose, and the page gives no explicit instruction either way.

**F2 — CONFUSING — Lab, repo's reference client.py differs from the page's printed client.py**
Page/step: Step 2 ("Create labs/m2/client.py").
Command run: `diff` (informal, via Read) between the printed page content and the repo's existing `labs/m2/client.py`.
Expected (page): 8 lines, no `sys.argv`, hard-coded prompt "Explain containers in one sentence."
Got (repo, pre-clone): 15 lines — adds `import sys`, reads `prompt = sys.argv[1] if len(sys.argv) > 1 else "Explain containers in one sentence."`, uses `prompt` in the `messages` list instead of the literal string.
Severity: CONFUSING — functionally compatible (both work), but if a learner ever diffs their hand-typed file against the repo (e.g., to "check their work" — a natural instinct), they will see a mismatch and may wonder if they made an error. Author-side drift between the page's authoritative snippet and the repo's shipped file.

**F3 — COSMETIC — Lab, Step 1a/1c Expected output assumes a single-model Ollama install**
Page/step: Step 1a ("List available models (from the host)") and Step 1c (container variant).
Command run: `/usr/bin/curl -s http://localhost:11434/v1/models | python3 -m json.tool` and the containerized equivalent.
Expected (quoted from page): a `data` array with exactly one entry, `"id": "qwen2.5:1.5b"`.
Got: `data` array with 19 entries (this machine has accumulated many previously-pulled models — `qwen3:0.6b`, `nomic-embed-text`, `mistral`, `gemma3`, etc. — from other course modules/projects on this machine). `qwen2.5:1.5b` is present as the first entry with a real `created` epoch (`1784714208`), matching the page's caveat that `created` "will differ on your machine."
Severity: COSMETIC — the page's caveat about `created` varying is present and correct; it does not extend that caveat to the array potentially containing more than one entry, which will surprise any learner (or reviewer) whose Ollama already has other models pulled from other courses/projects. Not a course defect since a genuinely fresh Ollama install would show exactly the one-entry array as documented; flagged only because this machine's real state diverges and the page doesn't anticipate that case explicitly the way it does for `created`.

**F4 — COSMETIC — Lab, Step 3 build timing note doesn't hold on a machine with the layers pre-cached**
Page/step: Step 3, blockquote after the `docker build` Expected output ("Expect ~10–30 seconds on a typical connection").
Command run: `docker build -t m2-client labs/m2/` (via `PATH="$HOME/.rd/bin:$PATH" docker build ...`).
Expected (quoted): "The first build pulls `python:3.12-slim` (~50 MB compressed) and installs `openai` (~2 MB) plus its dependencies. Expect ~10–30 seconds..."
Got: Build completed in ~0.2s wall time — `python:3.12-slim` and the `pip install openai` layer were both already cached on this machine (from a prior lab-validation pass of the same lab, or from another module reusing the same base image). All steps showed `CACHED` except the final `COPY`/export.
Severity: COSMETIC — this is normal Docker caching behavior and not something the page can fully control, but the page presents the ~10-30s figure as the expected first-run experience without caveating that repeat learners / machines with the base image already pulled will see it resolve near-instantly. Minor, does not block or confuse — it just means the "Expected output" timing prose won't universally match.

## M1 → M2 seam analysis

**Does M2's lab work as written from M1's end-state?** Yes, cleanly. M1 leaves the machine with: Ollama running natively on `:11434` serving `qwen2.5:1.5b`, and zero containers/networks left behind (all M1 containers used `--rm`). M2's lab Prerequisites line states exactly this requirement ("M1 complete — Rancher Desktop running, Ollama serving `qwen2.5:1.5b` natively at `:11434`. `docker` and `docker compose` on your PATH.") and it was fully satisfied without any additional setup, re-verification, or re-pulling. The lab's first command (`curl http://localhost:11434/v1/models`) succeeded immediately against the pre-existing native Ollama process — no restart, no re-pull needed.

**Does the M2 lesson/lab assume anything M1 (or setup) never established?** No structural gap found. The lab correctly assumes:
- `host.docker.internal` reachability from containers (M1 proved this pattern; M2 reuses it verbatim in Steps 1c, 3, 4).
- `qwen2.5:1.5b` already present (M1's end-state).
- A `labs/` directory convention (`labs/m2/...`) — this is new in M2 (M1's lab, per the sweep-01 report, presumably used a different path convention), but M2 creates its own `labs/m2/` subdirectory from scratch via `mkdir`-equivalent file creation, so no prior-module directory structure is required to already exist. No dangling assumption found here.

**Does the hand-authored-file path give ALL the information needed?** Yes for content — every byte of `client.py`, `Dockerfile`, and `compose.yaml` is printed in full on the page with correct syntax highlighting, and typing them exactly as shown produces a working lab (verified: build succeeded, direct run succeeded, compose run succeeded). The one gap is process, not content: the page never states whether the learner should create these files by hand in a fresh directory or by cloning/checking out the repo — see F1. This is a **CONFUSING**, not a **BLOCKER**, finding: the page is self-sufficient content-wise, but the "correct" workflow (author by hand vs. pull a finished copy) is left ambiguous, and the two paths lead to different learning outcomes.

**Verdict: seam is sound.** No BLOCKER-level gap. M1's end-state is necessary and sufficient for M2 Step 1 through teardown.

## Timing

| Section | Approx time (reading + executing) |
|---|---|
| Lesson (full read) | ~6 minutes |
| Lab Step 1 (a/b/c — host + container curl calls) | ~4 minutes |
| Lab Step 2 (write client.py) | ~2 minutes |
| Lab Step 3 (Dockerfile, build, direct run) | ~3 minutes (build was near-instant due to cache; a cold machine would add ~20-30s per the page's own estimate) |
| Lab Step 4 (compose.yaml, compose run) | ~3 minutes |
| Lab Step 5 (read-only — swap illustration, correctly not executed) | ~1 minute |
| Lab Step 6 (teardown) + Troubleshooting skim | ~2 minutes |
| Quiz (page load + skim) | ~2 minutes |
| **Total** | **~23 minutes**, under the page's stated "~30 minutes" |

## Did "Expected output" blocks match real output?

**Mostly yes, with two caveats already covered in findings.**

- Step 1a/1b (host curl, `/v1/models` and `/v1/chat/completions`): shape matched exactly (`object`, `data[]`/`choices[]`, `system_fingerprint: "fp_ollama"`, `usage` block). Content varied only where the page said it would (`created`, `id` suffix, reply wording) — **and** in array length for `/v1/models`, which the page did not call out (F3).
- Step 1c (container curl): shape matched exactly; same array-length caveat as above.
- Step 3 (`docker build` Expected output): step structure matched (FROM/RUN/WORKDIR/COPY, BuildKit `#N` numbering, "naming to docker.io/library/m2-client:latest done") — timing diverged because of cache (F4), content of the steps otherwise identical.
- Step 3 (`docker run --rm m2-client`): matched — "a sentence comes back, not an error," exactly as promised.
- Step 4 (`docker compose run --rm client`): matched, including the "Network m2_default Creating/Created" lines the page's blockquote anticipated for a first run.
- Step 6 (`docker compose down`): matched exactly — "Network m2_default Removed."

Overall: **yes, with specifics** — every Expected block was structurally accurate; the only mismatches were pre-existing machine state (extra Ollama models) and cache-driven timing, neither of which is a course authoring defect, but both worth a one-line caveat on the page (similar to the existing `created` caveat) to pre-empt learner confusion.

## Teardown

**Exact commands run** (as printed in Step 6 of the lab, from `labs/m2/`):

```
docker compose down
```

**Got:**
```
 Network m2_default Removing
 Network m2_default Removed
```

Matches the page's Expected output exactly.

**Final machine state after teardown** (checked via `docker ps -a`, `docker images`, `docker volume ls`, `docker network ls`, all prefixed `PATH="$HOME/.rd/bin:$PATH"` per this machine's shell setup):

- `docker ps -a`: no M2 containers, running or exited. (Three containers present are pre-existing and unrelated to this course: `opsmate-registry` up 2h, `gracious_haibt` exited 20h ago, `hub-dev-postgres` exited 6 days ago — none created by this M2 run.)
- `docker network ls`: `m2_default` is gone — teardown fully removed it. Remaining networks (`bridge`, `deploy_default`, `host`, `house-price-predictor_default`, `kind`, `mlflow_default`, `none`, `opsmate_default`) all pre-date this session and are unrelated to the course.
- `docker images`: `m2-client:latest`, `python:3.12-slim`, and `curlimages/curl:latest` **remain on disk** — the printed teardown (`docker compose down`) does not remove images, only the network. The lab's closing prose ("This 'build up, tear down' habit keeps your 16 GB laptop's footprint flat") is true for *running* containers/networks but the built images (260 MB `m2-client` + 205 MB `python:3.12-slim` + 37 MB `curlimages/curl`) persist. This is normal `docker compose down` behavior and not unexpected for a learner who understands Docker, but the "flat footprint" claim is about runtime memory, not disk — worth noting as it could read as slightly overstated to a learner tracking disk usage across 8 modules.
- `docker volume ls`: no M2-related volumes (M2's lab creates none). Existing volumes are all pre-existing/unrelated (other projects, plus `m5_chroma_data`/`m6_chroma_data`/`m7_chroma_data` from later modules already present on this machine from prior work, not created by this M2 run).

**Verdict: the printed teardown is correct and sufficient for what it claims to do** (remove the network; the model stays running natively as intended). It does not claim to remove images, and indeed doesn't — no discrepancy between claim and behavior, just a residual-disk-usage nuance worth a possible future callout.
