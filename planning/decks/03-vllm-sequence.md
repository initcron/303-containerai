# Module 3 — Production Serving with vLLM · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate. -->

<!-- 2026-07-25 round-3 skeleton regen (ADDENDUM for original decks, .superpowers/sdd/deck-regen-contract.md):
     this deck was authored pre-coursesmith (03-vllm.html loaded reveal.js 4.6.1 + Patrick Hand
     from CDNs) and had NO sequence spec — this file is the first one, authored from the shipped
     deck as the approved coverage baseline. All 14 old slides carried real hand-drawn SVGs already
     (no text-only defects to fix), so every SVG scene ports verbatim onto the new skeleton with no
     viewBox changes. Content parity: same 14 slides, same order, same pagenos (M3·01–14), same
     facts/numbers. The only structural changes: (1) every `p.takeaway` (12 of them, slides 2–13;
     slides 1 and 14 never had one) was REMOVED from the rendered HTML — none deleted as content,
     all relocated into this spec's Takeaway column below; (2) the two longer old subtitles that
     exceeded 80 chars (slides 3 and 5) were cut to one line ≤80 chars — the relocated clauses were
     already present as in-SVG labels/gray captions on those slides, so no fact was lost; (3) zero
     external refs — reveal.js 5.2 runtime + Patrick Hand woff2 are now inlined via the skeleton,
     killing the old cdnjs/fonts.googleapis.com loads. -->

This companion doc maps the 14-slide explainer deck (`site/static/decks/03-vllm.html`) to the
Module 3 lesson (`site/docs/m3-vllm/lesson.md`). The deck teaches **concepts**, not commands — it
turns the lesson's coffee-machine and virtual-memory analogies into hand-drawn whiteboard visuals a
learner walks through before opening the lab. The visual language follows the CourseSmith
whiteboard style contract (`templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive,
`#1e1e1e` primary / `#757575` secondary strokes on white paper with the five semantic pastel fills
(§1: green good · red bad/full · blue data · orange caution · purple meta — this deck uses the
neutral ink/gray palette throughout, no pastel fills in the original slides), the `#rough` wobble
filter on shapes only, and the shared `#ah`/`#ahg` arrowhead markers. The arc moves — **the crowd
problem with single-shot serving (Ollama) → the two engine tricks that fix it (continuous batching,
PagedAttention) → the throughput payoff → the unchanged client contract → how to run it on this
laptop (CPU track + the NUMA patch + tuning) → the documented GPU track → quantization → hand-off to
the lab.**

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Production Serving with vLLM (title) | Module framing: vLLM is the commercial machine behind the counter — many shots at once, heads never idle | Title sketch: a commercial multi-group espresso machine pulling four cups at once, ink protagonist box | credit line: Gourav Shah · School of DevOps & AI · Containers for GenAI & Agentic AI |
| 2 | What you'll learn | Set the four learning objectives: batching+paging throughput, same `/v1` contract, CPU track, GPU+quantization | numbered rows (circles 1–4) | Same client, bigger engine — you swap the backend, your application code never notices |
| 3 | Ollama is great — until the crowd arrives | The motivating problem: a single-slot server queues requests one at a time while slots could be idle | fan-out: a queue of waiting requests (R1–R4) feeding one single-slot server box, a clock signaling stalled throughput | Perfect for a developer at a laptop. Under concurrent load, finished slots sit idle and the queue backs up |
| 4 | Continuous batching — never let a head sit idle | The core fix: token-level scheduling refills a finished slot mid-flight instead of waiting for the whole batch | two-panel comparison: static batch (idle slot, waits for laggard) vs continuous batch (mid-flight refill, no idle slots) | As soon as a sequence emits its final token and leaves, a waiting request takes its place — the single biggest reason vLLM wins under load |
| 5 | PagedAttention — virtual memory for the KV cache | The memory trick that makes continuous batching affordable: page the KV cache like an OS pages RAM | two-panel comparison: naive reserved-contiguous-slab (60–80% wasted) vs paged on-demand allocation with a lookup table (<4% waste) | Near-zero memory waste means far more concurrent sequences fit — which is exactly what feeds continuous batching enough work to stay busy |
| 6 | The payoff: ~3x throughput under load | Quantify the combined effect of both tricks on the same hardware | bar chart: naive server (1x) vs vLLM (~3x) | Continuous batching + PagedAttention together give roughly 3x the throughput of a naive server on the same hardware |
| 7 | Same contract, bigger engine | The M2 payoff: the client speaks to the `/v1` contract, not the engine — swapping engines is a config change | hub-and-spoke: one client → `/v1` contract socket → branches to Ollama (:11434, dev) and vLLM (:8009, production) | Swapping Ollama for vLLM is a one-line change — point OPENAI_BASE_URL at the new address. No code, no SDK, no image change |
| 8 | The CPU track — learn the machinery anywhere | Frame why this module runs on CPU: Apple Silicon exposes no GPU to containers, so it's slow on purpose, for learning | big-box anatomy: a dashed container boundary holding the `openeuler/vllm-cpu` image, SmolLM2, and the `/v1` server, arrow out to "study the engine" | Throughput isn't the lesson on CPU — understanding the OpenAI server, the batcher, and quantization mechanics is |
| 9 | Why containers report 0 NUMA nodes | The signature teaching point: containers abstract away the host's NUMA floor plan, causing a division-by-zero crash, fixed by a guard patch | two-panel: host building with 4 NUMA-node rooms (dashed, gray) vs a container "apartment" (dashed, ink) that sees `numa_size = 0` and crashes, arrow to the one-line patch box | The signature teaching point: a surgical sed patch guards the division so an upstream image behaves in a containerized world |
| 10 | CPU tuning knobs that keep the laptop usable | The environment dials that keep the machine usable: thread caps, KV cache size, single-threaded BLAS | big-box anatomy: four boxes — `OMP_NUM_THREADS`, `VLLM_CPU_KVCACHE_SPACE`, `OPENBLAS/MKL=1`, "why leave cores free" | Multi-threaded BLAS and multi-threaded OpenMP thrash the cache and slow everything down — keep BLAS at one thread |
| 11 | CPU track vs GPU track | Compare the two tracks side by side across image, hardware, GPU enablement, shared memory, and goal | two-panel comparison table: CPU track (this module) vs GPU track (production) | Both speak the identical /v1 contract — your M2 client wouldn't change moving from CPU to GPU |
| 12 | GPU operational gotchas | Name the two flags and one sizing rule that separate a working GPU server from cryptic crashes | big-box anatomy: three boxes — `--gpus all` (NVIDIA Container Toolkit), `--ipc=host` (shared memory), VRAM sizing (7B model ≈14GB + headroom) | --max-model-len and --max-num-seqs cap KV-cache size and concurrency — the usual dials to fit memory |
| 13 | Quantization — trade a little precision for a lot of room | Compare the three quantization formats by bits, best use, and trade-off, using the JPEG-compression analogy | big-box anatomy: three format boxes — AWQ 4-bit, GPTQ 4-bit, FP8 8-bit, each with best-for + trade-off | Rule of thumb: 4-bit AWQ roughly quarters VRAM vs FP16 for a small accuracy cost — often how a 7B model fits a consumer 8 GB card |
| 14 | Same socket. Bigger engine. (closing) | Hand off to the lab: build the patched image, serve SmolLM2, point the unchanged M2 client at it | pipeline: Build → Serve → Point client, three boxes with arrows | credit + lab hand-off: Next — Lab: Serve SmolLM2 on CPU vLLM · Gourav Shah · School of DevOps & AI |

<!-- Visual pattern vocabulary used: title scene (1) · numbered rows (2) · fan-out (3) ·
     two-panel comparison (4, 5, 9, 11) · bar chart (6) · hub-and-spoke (7) · big-box anatomy
     (8, 10, 12, 13) · pipeline (14). -->

## Recommended presentation order

Present strictly 1 → 14; each slide's vocabulary is used by the next. Open on slide 1 to set the
café framing, then move briskly through 2 (the roadmap) into the motivating problem on slide 3 —
don't over-explain the queue picture, it's intuitive. **Slides 4 and 5 are the conceptual hinge of
the whole deck** — continuous batching and PagedAttention are the two mechanisms everything else
depends on, so give both diagrams real time and land each takeaway crisply before moving on; slide
6's payoff bar chart is the fast reward right after. Slide 7 (same contract) is a callback to M2 —
say it plainly, it should feel obvious once shown. Slides 8–10 are one continuous CPU-track
build-up (why CPU → the NUMA crash → the tuning knobs) — keep momentum across the three, with slide
9 (the NUMA patch) as the single most memorable teaching point in the module; don't rush it. Slide
11 is a quick comparison beat before slides 12–13 cover the GPU track and quantization at a similar
brisk pace (documented, not run). Slide 14 hands off to the lab. Under time pressure, compress
11–13 to a single pass each — never compress 4, 5, or 9.

## Fragment map

This deck has no hop-by-hop build-ups in the original — every slide is a static comparison,
anatomy, fan-out, or pipeline diagram that reads better whole. No fragments are used.

Static slides (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14) show the full picture at once.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. No orphans.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| §1 opener — Ollama as home espresso machine, one shot at a time | 3 | Fan-out: queue backs up behind a single-slot server |
| §1 — vLLM as the commercial café machine, continuous batching intro | 1, 4 | Title scene sets the café framing; slide 4 is the mechanism |
| §1 — continuous batching: token-level scheduling, no idle slots | 4 | Two-panel: static batch (idle, waits for laggard) vs continuous batch |
| §1 — PagedAttention: virtual memory for the KV cache | 5 | Two-panel: naive reserved slab (60–80% waste) vs paged on-demand (<4% waste) |
| §1 — ~3x throughput payoff | 6 | Bar chart: naive (1x) vs vLLM (~3x) |
| §2 — same `/v1` OpenAI-compatible contract, one-line engine swap | 7 | Hub-and-spoke: client → contract → Ollama/vLLM branches |
| §3 — CPU track: Apple Silicon no GPU passthrough, slow on purpose | 8 | Big-box anatomy: container with image, SmolLM2, /v1 server |
| §3 — why containers report 0 NUMA nodes, division-by-zero crash, the sed patch | 9 | Two-panel: host NUMA floor plan vs container apartment, arrow to patch |
| §3 — CPU tuning knobs: OMP_NUM_THREADS, VLLM_CPU_KVCACHE_SPACE, single-threaded BLAS | 10 | Big-box anatomy: four env-var boxes |
| §4 — GPU track: image, hardware, NVIDIA Container Toolkit, --ipc=host, VRAM sizing | 11, 12 | Slide 11 is the CPU-vs-GPU comparison table; slide 12 is the GPU gotchas detail |
| §5 — quantization: AWQ, GPTQ, FP8 — bits, best-for, trade-off | 13 | Big-box anatomy: three format boxes |
| §6 — operational gotchas: --max-model-len, --max-num-seqs, VRAM/RAM sizing | 12 | Folded into the GPU gotchas slide's takeaway (sizing dials) |
| Module roadmap ("what you'll learn") | 2 | Numbered rows, four objectives |
| Lab hand-off — build patched image, serve SmolLM2, point client | 14 | Pipeline: Build → Serve → Point client |

**No orphans.** Every lesson section (§1–§6) plus the roadmap intro and the closing lab hand-off has
at least one slide anchor. The Summary table at the end of the lesson is a recap of concepts already
covered by slides 1–13 and is not a separate slide anchor.
