# Learner-QA Sweep 01 — Homepage → Intro → Setup → M1

- **Date:** 2026-07-22
- **Tester role:** first-time learner, published pages only (https://initcron.github.io/303-containerai/), commands executed exactly as printed
- **Machine:** arm64 Mac, Rancher Desktop running (docker server 29.5.2), Ollama 0.32.0 already serving natively on :11434, `qwen2.5:1.5b` already pulled (pre-existing state, honestly reconciled against the setup steps)
- **Scope/seam:** does Intro tell you what to install before M1 needs it? Does Setup leave you with everything M1's lab assumes?

## Verdicts

| Page | Verdict |
|---|---|
| Homepage | **PASS** |
| Introduction | **PASS** |
| Setup · Prerequisites | **PASS-WITH-FINDINGS** (F3, F4, F5) |
| Setup · The GPU Reality | **PASS-WITH-FINDINGS** (F6) |
| M1 · Lesson: Container-Native GenAI | **PASS** |
| M1 · Lab: Prove the Wiring | **PASS-WITH-FINDINGS** (F1, F2, F5, F7) |
| M1 · Quiz | **PASS** |

No BLOCKERs. Every lab step completed and every wiring claim the pages make proved true live. The findings are seam/polish issues, led by the missing clone instruction (F1).

---

## Findings

### F1 — M1 Lab Step 4 assumes a cloned course repo that no page ever told me to clone — **CONFUSING** (the seam finding)

- **Page + step:** M1 Lab, "Step 4 — Wrap it in a script".
- **Page text:** "The `labs/m1/` directory of this repo already includes a convenience script, `call-ollama.sh` … **From the root of the course repo (where you cloned it)**, make it executable."
- **Expected:** By this point some earlier page (Intro prerequisites, Setup, or an earlier lab step) should have said "clone the course repo" and given the URL.
- **Got:** No page on the walked path (homepage, intro, prerequisites, gpu-reality, M1 lesson, M1 lab Steps 1–3) contains a `git clone` instruction or a clone URL. The only signpost is the navbar/footer "GitHub" link (github.com/schoolofdevops/303-containerai). I had to guess:

  ```
  git clone https://github.com/schoolofdevops/303-containerai.git
  Cloning into '303-containerai'...
  ```

  The guess worked and `labs/m1/call-ollama.sh` exists, so I could proceed — hence CONFUSING, not BLOCKER. A less confident learner stalls here.
- **Severity:** CONFUSING (borderline BLOCKER for learners who won't guess).
- **Fix direction (for author):** add an explicit "Clone the course repo" step with the URL — either in Setup/Prerequisites or at the top of the M1 lab before Step 4.

### F2 — The public repo a learner clones exposes author-internal files — **CONFUSING** (minor)

- **Page + step:** consequence of M1 Lab Step 4 (the clone).
- **Expected:** a learner-facing repo (labs, README).
- **Got:** repo root listing after clone:

  ```
  CLAUDE.md
  containers_genai_agentic.md
  decks
  labs
  planning
  README.md
  site
  ```

  `CLAUDE.md`, `planning/`, and the raw outline `containers_genai_agentic.md` are author/build internals sitting next to `labs/` in the repo learners are sent to. (I did not read them, per QA rules — their presence in the clone is the finding.)
- **Severity:** CONFUSING (minor — nothing breaks, but a learner exploring the repo root meets internal build machinery).

### F3 — Setup Step 2: `ollama serve &` errors if Ollama is already running — **CONFUSING**

- **Page + step:** Setup · Prerequisites, "2. Install Ollama", command `ollama serve &`.
- **Expected (page):** starts the service; next command shows "Ollama is running".
- **Got (run exactly as printed on a machine where Ollama was already running — the common case when Ollama.app autostarts or brew services manages it):**

  ```
  Error: listen tcp 127.0.0.1:11434: bind: address already in use
  ```

  The follow-up `curl http://localhost:11434/` still prints `Ollama is running` (the pre-existing instance), so the environment is actually fine — but the learner has just seen a red "Error:" during setup with no note explaining it's harmless/expected when Ollama is already up.
- **Severity:** CONFUSING.
- **Note:** the page's own Troubleshooting box uses `pkill ollama` first — a one-line "if you see *address already in use*, Ollama is already running; skip ahead" would close this.

### F4 — Setup Step 3: Expected pull output shows an impossible digest — **COSMETIC**

- **Page + step:** Setup · Prerequisites, "3. Pull the course dev model", `ollama pull qwen2.5:1.5b`.
- **Expected (page):**

  ```
  pulling manifest
  pulling azc9e5e2e492... 100% ▕████████████████████▏ 986 MB
  verifying sha256 digest
  writing manifest
  success
  ```

  `azc9e5e2e492` contains `z` — not a valid hex sha256 fragment; it reads as a fabricated capture.
- **Got (real):**

  ```
  pulling manifest
  pulling 183715c43589: 100% ▕██████████████████▏ 986 MB
  pulling 66b9ea09bd5b: 100% ▕██████████████████▏   68 B
  pulling eb4402837c78: 100% ▕██████████████████▏ 1.5 KB
  pulling 832dd9e00a68: 100% ▕██████████████████▏  11 KB
  pulling 377ac4d7aeef: 100% ▕██████████████████▏  487 B
  verifying sha256 digest
  writing manifest
  success
  ```

  (Model was already present; a fresh pull additionally shows download progress. Size 986 MB and `success` matched.)
- **Severity:** COSMETIC — but it undermines the course's "Expected output blocks are real captures" trust.

### F5 — `docker version` Expected block shows a Docker-CE server header Rancher Desktop never prints — **COSMETIC** (appears on TWO pages)

- **Page + step:** Setup · Prerequisites step 1 AND M1 Lab Step 1 (same block both places).
- **Expected (page):**

  ```
  Client:
   Version:           29.5.3-rd
   ...
  Server: Docker Engine - Community
   Engine:
    Version:          29.5.2
  ```

- **Got (real, Rancher Desktop — the course's recommended runtime, and clearly the machine the capture came from since the client is `29.5.3-rd`):**

  ```
  Client:
   Version:           29.5.3-rd
   ...
  Server:
   Engine:
    Version:          29.5.2
  ```

  There is no `Docker Engine - Community` text in Rancher Desktop's output; the Expected block is internally inconsistent (rd client + Docker CE server header). The page's tolerance note ("what matters is that both Client and Server sections appear") kept this from misleading me.
- **Severity:** COSMETIC.

### F6 — GPU Reality prints a runnable `docker run` for a 3.6 GB image with no size warning — **CONFUSING** (mild)

- **Page + step:** Setup · The GPU Reality, "Learning vLLM Without a GPU":

  ```
  docker run --rm vllm/vllm-openai-cpu:latest-arm64 --help
  ```

- **Expected:** a setup-section command a learner can safely run while reading.
- **Got:** the command works (help text printed, 28.7s — image was already local on this machine):

  ```
  INFO 07-22 09:57:35 [importing.py:88] Triton not installed or not compatible; ...
  usage: vllm serve [model_tag] [options]
  ...
  ```

  but `vllm/vllm-openai-cpu:latest-arm64` is **3.61 GB** on disk. On a fresh machine this line — sitting in the Setup section, though it's really M3 material — triggers a multi-gigabyte unannounced pull. No "this is optional / M3 will use this / ~3.6 GB download" note.
- **Severity:** CONFUSING (mild) — nothing breaks, but bandwidth-limited learners get ambushed.

### F7 — M1 Lab Troubleshooting: "curlimages/curl:latest is ~3 MB" is wrong — **COSMETIC**

- **Page + step:** M1 Lab, Troubleshooting, "Container pull is slow (first run)".
- **Expected (page):** "curlimages/curl:latest is ~3 MB — it downloads once and is cached."
- **Got:** `docker images` shows `curlimages/curl:latest 37.4MB` (on-disk; compressed pull is ~10–20 MB — either way, not ~3 MB).
- **Severity:** COSMETIC.

---

## Seam: Intro → Setup → M1

**Verdict: seam is strong except for F1.**

- Intro's Prerequisites section names everything Setup then installs (runtime, native Ollama, RAM/disk, accounts) — consistent, no orphan requirements.
- Setup's quickstart ends with the exact wiring test (`docker run … host.docker.internal:11434 …`) that M1's lab Step 3 re-proves — so a learner who completed Setup arrives at M1 with the runtime running, Ollama serving natively, `qwen2.5:1.5b` pulled, and the bridge already verified once. M1's stated prerequisites line ("Rancher Desktop … running; Ollama installed natively; qwen2.5:1.5b pulled") is 100% covered by Setup. Excellent.
- GPU Reality primes exactly the concept M1's lab demonstrates; M1 lesson §3 cross-links back to it. Coherent.
- **The single seam gap:** M1 Lab Step 4 needs a cloned course repo, and no upstream page establishes it (F1). Everything else M1 assumes, Setup delivered.
- Setup's Troubleshooting warns Ollama may need `OLLAMA_HOST=0.0.0.0`; on this machine the wiring worked without it (correctly presented as only-if-it-fails guidance).

## Expected-output blocks vs reality (per command)

| Command | Match? |
|---|---|
| `docker version` (Setup + M1 Step 1) | Shape matched; "Server: Docker Engine - Community" line never appears (F5) |
| `curl http://localhost:11434/` | **Exact match** ("Ollama is running") |
| `ollama pull qwen2.5:1.5b` | `success` + 986 MB matched; digest/layer lines differ, printed digest invalid (F4) |
| Setup wiring `docker run curlimages/curl …` | Matched the promise — got `"response":"Hello! How can I assist you today?"` |
| `docker run … vllm-openai-cpu … --help` (GPU Reality) | No Expected block printed; command works (F6 re size) |
| `ollama list` (M1 Step 2) | Matched — including the model ID `65ec06548149` shown on the page (my MODIFIED time differs; extra unrelated models present on this machine, page correctly says only "qwen2.5:1.5b should appear") |
| `curl -s http://localhost:11434/api/tags` | Matched abbreviated shape (`{"models":[{"name":"qwen2.5:1.5b",…`) |
| M1 Step 3 `docker run … /api/generate` | Matched — `{"model":"qwen2.5:1.5b",…,"response":"Hello there!","done":true,…}`; page correctly warns wording varies |
| `chmod +x labs/m1/call-ollama.sh` | OK (exit 0) |
| `./labs/m1/call-ollama.sh` (default) | Matched shape — response: "A container is a lightweight, standalone, executable package…" |
| `./labs/m1/call-ollama.sh "What is a container registry in one sentence?"` | Matched shape — response: "A container registry stores and manages images used to create Docker containers." |
| `cat labs/m1/call-ollama.sh` | Matches the page's description ("thin wrapper, no surprises") — it is exactly the Step 3 command parameterized |

Also verified: both deck links (`decks/00-introduction.html`, `decks/01-container-native.html`) return HTTP 200; the GPU Reality Mermaid diagram is absent from static HTML (SSR placeholder `<!-- -->`) but **renders correctly in a real browser** (verified via headless Chrome — `docusaurus-mermaid-container` + SVG present). Not a finding.

## Timing

| Section | This machine (warm) | Fresh-machine estimate |
|---|---|---|
| Setup quickstart (4 steps) | ~2 min | ~15–30 min (installs + ~1 GB model pull) |
| GPU Reality read + its one command | ~5 min read; command 29 s (image local) | + ~3.6 GB pull if run |
| M1 Lab Steps 1–3 | < 2 min | ~5 min (first `curlimages/curl` pull) |
| M1 Lab Step 4 (incl. guess-clone) | ~2 min | ~5 min |
| M1 Lab total | **~5 min** | fits comfortably inside the page's "~20 minutes" |

## Teardown / end-state

**The M1 lab page contains no teardown section.** Per QA rules I did not improvise one. In practice nothing needed tearing down: every container the lab starts uses `docker run --rm` and exited on its own. Final state:

- No course-started containers running. (`docker ps` shows only `opsmate-registry` — a pre-existing container from before this QA run, untouched.)
- Ollama still serving natively on :11434 (pre-existing); `qwen2.5:1.5b` present.
- Images cached: `curlimages/curl:latest` (37.4 MB), `vllm/vllm-openai-cpu:latest-arm64` (3.61 GB, was already local).
- Learner clone of the course repo left in the session scratchpad (outside the project tree).
- The stray `ollama serve &` from F3 exited immediately (bind error) — no lingering process.

Next module's QA starts from: runtime up, Ollama serving, `qwen2.5:1.5b` pulled, no lab containers running.
