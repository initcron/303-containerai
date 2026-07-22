# Learner-QA Sweep 03 — M3 "Production Serving with vLLM"

**Tester role:** first-time learner, published pages only.
**Site under test:** https://initcron.github.io/303-containerai/ (mirrors schoolofdevops.github.io — same build)
**Module:** M3 · Production Serving with vLLM (prior module / seam partner: M2)
**Sidebar order (verified from live pagination):** M2 Quiz → **M3 Lesson → M3 Lab → M3 Quiz** → M3B Lesson. (M3B Fine-Tuning is a separate module, out of scope.)
**Date:** 2026-07-22
**Starting state (as given):** Rancher Desktop up; native Ollama serving qwen2.5:1.5b on :11434; no course containers running; `m2-client` / `python:3.12-slim` / `curlimages/curl` cached from M2.

> **QA-process note (transparency):** this sweep was executed twice-over — an initial learner-agent
> walk and a dispatcher takeover that re-executed every load-bearing step independently after the
> two runs briefly overlapped on shared Docker state. Every Expected-vs-Got claim below was
> **re-verified firsthand on a clean cycle** (fresh volume, fresh container, cold model download).
> Where the two runs diverged, the firsthand re-verification is what's recorded.

---

## Verdict per page

| Page | Verdict |
|------|---------|
| Lesson: Production Serving with vLLM | **PASS** |
| Lab: Serve SmolLM2 on CPU vLLM | **PASS-WITH-FINDINGS** |
| Quiz: Module 3 | **PASS-WITH-FINDINGS** |

The lab is fully completable from M2's end-state and the course through-line (env-var engine swap,
same client) is **proven live, twice**. No BLOCKERs. All findings are CONFUSING/COSMETIC. The only
hard block encountered (host port 8009 resetting connections) is a **machine-local stale Rancher
Desktop port-forward**, not a course bug — see Machine-Local Observations.

---

## LESSON — PASS

Read in full on the rendered site. Café/espresso analogy for continuous batching; virtual-memory
analogy for PagedAttention; "same /v1 contract" wall-socket callback to M2; CPU track with the
NUMA sed patch as the signature teaching point; GPU track documented-only; quantization table
(AWQ/GPTQ/FP8); operational gotchas; summary table.

- **Analogies present and strong** (espresso café, OS paging, furnished-apartment-for-NUMA,
  JPEG-for-quantization). Analogy-first convention met.
- **Cold-start expectation IS set:** §6 gotchas — *"First run is slow: the image is multi-GB and
  the model downloads on first launch (both cached afterward)… Expect a wait; it's the machine,
  not a hang."* This pre-empts exactly the wait we measured (~4 min to first readiness).
- **The sed patch line renders** as a single readable code block (raw `<pre>` checked — no
  flattening).
- **VM sizing is not in the lesson** — it lives in the lab's top setup note, which is the right
  place. Noted for the seam section: M3 establishes the sizing itself rather than assuming it.
- Read time: ~6–8 min. No commands on this page.

---

## LAB — PASS-WITH-FINDINGS

Every participant-facing command executed in printed order. Machine-local accommodations applied
silently: `PATH="$HOME/.rd/bin:$PATH"` prefix for docker, and host port **8010 via the lab's own
`VLLM_PORT` variable** after the machine-local 8009 stale forward (details in Machine-Local
Observations; the substitution touches only the host-side port in URLs).

### Step 0 — VM sizing (setup note at top of lab)

Page: *"Give your runtime at least 4 CPUs and 6 GB of memory."* Rancher Desktop VM was already
**5 CPU / 8 GB** (`rdctl list-settings`) — satisfies the stated minimum and exceeds the compose
caps (cpus 4.0 / mem 5G), so no reconfigure/restart was needed. This is the correct tested path;
the page's requirement is a minimum, already met. VM left at 5/8.

**Seam-relevant:** M1/M2 ran the model natively and never established VM sizing; M3 is the first
module to need it, and the lab sets it itself, at the top, before anything runs. Sound.

### Step 1 — Dockerfile + build

- `cat Dockerfile` → real file matches the Expected block's FROM / sed-patch / ENV content
  exactly; the real file additionally carries explanatory comment lines the Expected block omits
  (see F6, cosmetic).
- `docker compose build` → exit 0. Output ends `naming to docker.io/library/vllm-cpu-optimized:latest`
  — matches Expected shape. On this machine the base image/sed layer were **CACHED** (~1 s build);
  a true first-timer pulls a multi-GB base here — the page sets that expectation (Time line +
  first-run warning), so not a finding.

### Step 2 — Serve

- `docker compose up -d` (verified on a fully clean cycle) →
  ```
  Network m3_default    Created
  Volume m3_hf-cache    Created
  Container vllm-smollm2  Started
  ```
  Matches Expected (volume + container; the extra network line is covered by the page's
  output-variance note).
- `docker compose logs -f vllm-cpu` → `Triton not installed` warning appears exactly as the page
  pre-warns; progresses through weight download to route listing and
  `INFO: Application startup complete.` Matches Expected tail.
- **Cold-start timing (measured twice):** first load 3 m 44 s (container start → startup
  complete); second cold cycle (fresh volume, weights re-downloaded) health-200 at **240 s**.
  Both inside the page's "first run is slow / give it a minute and retry" framing. Expectation
  is set adequately on both lesson and lab.
- `curl http://localhost:8009/health` **as printed** → `curl` exit 56 (connection reset) — this
  is the machine-local stale 8009 forward, NOT the course (container simultaneously healthy:
  in-container `curl localhost:8000/health` → 200; compose healthcheck `healthy`). Switched to
  the lab's own `VLLM_PORT` override → on 8010, `/health` returns **HTTP 200, empty body**,
  exactly as the page describes. (Empty Expected block noted in F1.)

### Step 3 — Same OpenAI contract

- **3a `GET /v1/models`** → real output matches Expected shape: `object:"list"`,
  `data[0].id = "HuggingFaceTB/SmolLM2-135M-Instruct"`, `owned_by:"vllm"`,
  **`max_model_len: 1024`** — verified firsthand with no `.env` present (compose defaults), the
  state a learner is in at Step 3. Extra fields (`root`, `parent`, `permission[]`) are present
  and covered by the "vLLM extends the OpenAI schema" note. **But** after Step 4's
  `cp .env.example .env` the same call reports **2048** — see F2.
- **3b `POST /v1/chat/completions`** → HTTP 200 in **6.8 s** (within "tens of seconds").
  `choices[0].message.content` matched the page's real capture **verbatim**:
  *"Linux containers are virtualized environments that run applications and services without
  requiring network connections or additional hardware, allowing for efficient application
  running on minimal infrastructure."* `usage` matched exactly too
  (`prompt_tokens: 40, completion_tokens: 29, total_tokens: 69`). Extra null fields
  (`reasoning_content`, `tool_calls`, `stop_reason`, `kv_transfer_params`…) covered by the note.
- **3c M2 client → vLLM (the course through-line)** —
  `docker compose -f ../m2/compose.yaml run --rm -e OPENAI_BASE_URL=… -e MODEL=… client python client.py "…"`
  - As printed (port 8009): fails with connection reset from inside the client container —
    same machine-local 8009 issue, recorded as machine-local only.
  - On 8010 (machine-local substitution): **succeeds in ~8 s.** The unchanged, cached
    `m2-client:latest` image — no rebuild, no code change — got an answer from vLLM:
    *"A container is a stored object that is a block of memory that can take on different views
    or states at any time, so that you can access specific elements anywhere."* Rough wording,
    exactly as the page warns for a 135M model; differs from the page's sample answer, which the
    page explicitly permits. **Through-line proven: two env vars swapped the engine.**

### Step 4 — Tuning knobs

- `cp .env.example .env` → no output (page's Expected block is an empty box — F1).
- Edited `.env` per the page block: `MODEL_NAME=…135M…` (already the value), `OMP_THREADS=4`,
  `MAX_NUM_SEQS=4`; machine-local `VLLM_PORT=8010`.
- `docker compose up -d` → `Container vllm-smollm2 Recreated` — matches Expected. Healthy again
  in ~30 s (weights cached in volume).
- Knob verified applied: `docker exec vllm-smollm2 printenv OMP_NUM_THREADS` → `4`.
- `docker stats vllm-smollm2 --no-stream` →
  ```
  CONTAINER ID   NAME           CPU %     MEM USAGE / LIMIT   MEM %     …
  ca8f6befbb8b   vllm-smollm2   5.31%     2.303GiB / 5GiB     46.06%    …
  ```
  MEM USAGE in the Expected's ballpark; CPU% low because measured idle (the page says "while a
  request runs" — its 180.4% is plausible under load, not a finding). **LIMIT is 5GiB; the page's
  Expected prints 8GiB — see F3.**
- Step 4 side-effect on `/v1/models`: `max_model_len` now reports **2048** (from
  `.env.example`'s `MAX_MODEL_LEN=2048`), silently diverging from Step 3a's printed 1024 — F2.

### Step 5 — GPU track (read-only)

Not executed, exactly as the page instructs ("Do not execute these here"). Commands and prose
consistent with the lesson's GPU table.

### Step 6 — Teardown (printed steps followed exactly)

- `docker compose down` →
  ```
  Container vllm-smollm2  Removed
  Network m3_default      Removed
  ```
  Matches Expected (page shows the container line; network line covered by variance note).
- `docker compose down -v` (printed as the also-clear-weights variant) →
  ```
  Volume m3_hf-cache  Removed
  ```
  Matches Expected. Both teardown blocks behaved as printed.

### Timing (wall-clock, this machine/network)

| Section | Time | Note |
|---|---|---|
| Lesson read | ~6–8 min | read-only |
| Step 1 build | ~1 s cached | minutes cold (multi-GB pull) — page warns |
| Step 2 up → `Application startup complete` | **3 m 44 s** (first) / **240 s** (repeat cold cycle) | model download; page sets expectation |
| Step 2 health probe on 8009 | blocked (machine-local) | container healthy throughout |
| Step 3a models | <1 s | |
| Step 3b chat | **6.8 s** | within "tens of seconds" |
| Step 3c M2 client | **~8 s** | includes client-container create |
| Step 4 recreate → healthy | ~30 s | weights cached in volume |
| Step 6 teardown | ~11 s | |

**Did Expected-output blocks match?** Yes in shape everywhere; the 3b chat content and usage
numbers matched **verbatim**. Numeric mismatches: F2 (`max_model_len` after Step 4) and F3
(stats LIMIT 8GiB vs real 5GiB). Intentional-empty blocks: F1.

---

## QUIZ — PASS-WITH-FINDINGS

Rendered page shows 5 interactive questions with per-option explanations and
`Check answers` / `Reset` — the Quiz component renders correctly (no raw MDX leakage; raw HTML
checked). Q1 is multi-select ("Select all that apply"). Questions map to the module's actual
concepts: (1) batching+PagedAttention, (2) PagedAttention↔virtual memory, (3) engine swap,
(4) NUMA patch, (5) quantization trade-offs. All answerable from the lesson/lab.

One content inconsistency: Q3's intended-correct option — see **F5**.

---

## Numbered findings

**F1 — COSMETIC.** Lab Step 2 (`/health`) and Step 4 (`cp .env.example .env`). The page renders
**empty "Expected output" code blocks** for commands whose output is genuinely empty. Literally
correct (health = HTTP 200 with empty body; `cp` prints nothing), but an empty grey box reads as
a rendering failure to a first-timer. The `/health` case is softened by the following prose; the
`cp` case has no reassurance at all. Suggest a `(no output)` placeholder or a one-line note.

**F2 — CONFUSING.** Lab Steps 3a↔4. Command: `curl -s http://localhost:8009/v1/models | python3 -m json.tool`.
Expected (page): `"max_model_len": 1024`. Got: **1024 before Step 4** (no `.env`, compose default
`${MAX_MODEL_LEN:-1024}` — verified firsthand) but **2048 after Step 4's `cp .env.example .env`**,
because the shipped `.env.example` sets `MAX_MODEL_LEN=2048` (and `MAX_NUM_SEQS=8`), disagreeing
with the compose defaults (1024/4). The page never mentions that Step 4 silently changes the
serving config beyond the two knobs it tells you to edit; a learner re-running 3a afterwards (or
copying `.env` early) sees 2048 vs the printed 1024 and may think something broke. The Step 4
edit `MAX_NUM_SEQS=4   # fewer concurrent sequences` only reads as "fewer" relative to
`.env.example`'s 8 — relative to the compose default it's the same value. Align `.env.example`
with the compose defaults, or note the change on the page.

**F3 — CONFUSING.** Lab Step 4. Command: `docker stats vllm-smollm2 --no-stream`.
Expected (page): `MEM USAGE / LIMIT … 2.1GiB / 8GiB`. Got: `2.303GiB / 5GiB`. The printed
**8GiB LIMIT contradicts the compose memory cap** the page itself quotes at the top ("caps the
container at cpus: 4.0 / memory: 5G") and `.env.example`'s `MEMORY_LIMIT=5G`. Usage/CPU%
divergence is fine (idle vs under load); the LIMIT is a stale capture. Regenerate the Expected
block with the real 5GiB limit.

**F4 — COSMETIC.** Lab Step 2 "Expected output (excerpt)" of `compose.yaml` is a **paraphrase,
not a verbatim excerpt**: it prints numbered inline comments ("(2) SYS_NICE …", "(3) CPU has no
bf16 kernel …") that don't exist in the shipped file, uses flow-style `build: {context: …}` where
the file uses block style, and shows a literal `ports: "8009:8000"` where the file has
`"${VLLM_PORT:-8009}:8000"`. Also the excerpt shows `--swap-space` fed by `SWAP_SPACE`, which
`.env.example` never defines (harmless — default 1 applies). A learner diffing their `cat` output
against the page sees different text throughout. Labeling as "excerpt" softens this, but the
comments shown should exist in the file (or the capture should be real).

**F5 — CONFUSING.** Quiz Q3 ("You built a client against Ollama in M2… What has to change?").
The intended-correct option says **"Only OPENAI_BASE_URL"** changes. But the lab's Step 3c —
which the learner just ran — overrides **two** env vars (`OPENAI_BASE_URL` **and** `MODEL`), and
the lab's own prose says *"Two environment variables swapped the engine behind the /v1 wall
socket."* (The lesson §2 also says "point OPENAI_BASE_URL at the new address" one-line change.)
The three distractors are clearly wrong so the learner can still pick the intended answer, but
the "only" contradicts the hands-on experience of thirty seconds earlier. Reword to "just the
environment (base URL + model name) — no code, SDK, or image change."

**F6 — COSMETIC.** Lab Step 1. Command: `cat Dockerfile`. The Expected block omits the comment
lines present in the shipped Dockerfile (header comment + per-section comments). Content
otherwise identical. Trivial; the variance note arguably covers it.

---

## Seam assessment: M2 → M3 — PASS

**Does M3's lab work from M2's end-state as written? Yes.**

- **The M2-client reuse is the seam's core and it works live.** Step 3c runs
  `docker compose -f ../m2/compose.yaml run --rm` against the cached `m2-client:latest` — no
  rebuild triggered, no code change; the client answered from vLLM. Verified twice (two separate
  runs). The two-env-var override is exactly the interface M2 taught.
- **No leftover-M2 interference.** M3 creates its own objects (`m3_default` network,
  `m3_hf-cache` volume, `vllm-smollm2` container); nothing collides with M2 images or with
  native Ollama on 11434 (untouched all session). Teardown removed exactly M3's objects.
- **VM sizing:** M2 never established container-runtime sizing (models ran natively). M3 needs
  it and **tells the learner to set it at the top of the lab** (≥4 CPU / 6 GB) before anything
  runs — the page does not silently assume prior state. On this machine 5/8 already satisfied
  the minimum, so the instruction was a no-op check.
- **Port hygiene:** compose comments say host 8009 "keeps clear of Ollama on 11434" — deliberate
  seam-aware choice (the 8009 trouble on THIS machine is a local defect, not the design's fault).

---

## MACHINE-LOCAL OBSERVATIONS (not course findings)

1. **docker not on default PATH** — every executed docker/compose command was prefixed
   `PATH="$HOME/.rd/bin:$PATH"`. Learner pages correctly assume docker on PATH.
2. **Stale Rancher Desktop port-forward on host 8009 (the only hard block).**
   `curl http://localhost:8009/health` → exit 56 (connection reset) while the container was
   demonstrably healthy: in-container `curl localhost:8000/health` → 200; compose healthcheck
   `healthy`; `lsof` shows a leftover Rancher **`Reflector` process (PID 26182) LISTENing on
   *:8009** and resetting connections. Per the accommodation rule — and because the lab
   legitimately exposes a **`VLLM_PORT`** variable (compose `"${VLLM_PORT:-8009}:8000"`,
   `.env.example` line `VLLM_PORT=8009`) — the walk continued on **8010**; every step succeeded
   there. Step 3c was first run as printed on 8009 to record the real failure
   (`Connection reset by peer` from inside the client container) before substituting. A learner
   on a healthy machine would not hit any of this.
3. **rtk command-rewriting hook** (this machine's global token-optimizer) intercepted several
   raw commands (`grep -o/-E`, `curl | json.tool` → schema-summarized JSON, one mangled `cd`).
   Worked around by running lab commands via plain `sh` script files so all captured output is
   raw and faithful. Unrelated to the course.
4. **Unrelated containers live on this machine:** `gateway-litellm-1/-pg-1/-analyzer-1/-anonymizer-1`
   (a 305-llmops project stack, started/restarted by other sessions mid-sweep) plus two old
   exited containers; the pre-existing `opsmate-registry` was removed by another session
   mid-sweep. None are M3 objects; M3's teardown touched only its own.
5. **Caching skew vs a true first-timer:** the openeuler base layers were already cached
   (build ~1 s instead of minutes). Model-weight download WAS exercised cold twice
   (3 m 44 s / 240 s to ready). The page's expectations cover both waits.
6. **Dual-runner overlap (QA process):** the initial learner-agent and the dispatcher takeover
   briefly operated on the same compose project mid-sweep (an `.env`/recreate race). All
   load-bearing evidence in this report was subsequently re-captured on a clean, single-runner
   cycle; nothing in the findings rests on the overlapped window.

---

## Final machine state after teardown (next module starts here)

- **M3 objects: none.** `vllm-smollm2` removed, `m3_default` removed, `m3_hf-cache` removed
  (both printed teardown blocks run, outputs matched). `.env` removed from the lab clone
  (gitignored learner artifact; clone back to as-checked-out).
- **Running containers:** only the non-course `gateway-*` stack (other project) + native Ollama
  on :11434 untouched. Zero course containers.
- **Images retained:** `vllm-cpu-optimized:latest` (~5.4 GB) remains — the printed teardown
  never removes images, so this is the correct end-state. M2 images (`m2-client`,
  `python:3.12-slim`, `curlimages/curl`) still cached.
- **VM sizing: 5 CPU / 8 GB — unchanged all sweep.** The lab asks for a minimum (4/6) that was
  already met; it never asks to revert sizing afterward, so it is left as-is (noted: ≥ the
  course minimum, fine for downstream modules).
