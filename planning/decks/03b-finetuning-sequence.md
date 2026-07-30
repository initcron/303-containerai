# Module 3B — Customizing Models with LoRA/QLoRA · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate. -->

This companion doc maps the 12-slide explainer deck (`site/static/decks/03b-finetuning.html`) to the
Module 3B lesson (`site/docs/m3b-finetuning/lesson.md`). The deck teaches **concepts**, not commands —
it turns each of the lesson's analogies into a hand-drawn whiteboard visual a learner walks through
before opening the lab. The visual language follows the CourseSmith whiteboard style contract
(`templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary / `#757575`
secondary strokes on white paper with the five semantic pastel fills (§1: green good · red bad/full ·
blue data · orange caution · purple meta), the `#rough` wobble filter on shapes only, and the shared
`#ah`/`#ahg` arrowhead markers. The arc moves — **the behaviour gap no prompt closes → the three-way
decision (prompt/RAG/fine-tune) → LoRA as sticky notes on a frozen textbook → QLoRA squeezing the base
to 4-bit → the open-source toolchain split by hardware → the same GPU-reality constraint from earlier
modules → why the frozen container is the reproducibility unit → the tiny adapter you actually ship →
the pipeline it feeds → the two lab tracks that converge on one adapter.**

**2026-07-26 round-3 skeleton regen (original-deck ADDENDUM).** This deck predates CourseSmith and had
no sequence spec — it loaded reveal.js 4.6.1, its white theme, and Patrick Hand from CDNs (three live
`<link>`/`<script>` refs). Per `.superpowers/sdd/deck-regen-contract.md`'s ADDENDUM for original decks,
this spec is authored FIRST using the **old deck as the approved coverage baseline**: all 12 old slides
map 1:1 to the 12 rows below, same order, same pagenos (`M3B·01`–`12`), same facts/numbers, same SVG
scenes ported verbatim (no viewBox changes were needed — all were already ≤380 tall and read cleanly at
`max-height:68%`). The old deck's kicker wording (`MODULE 3B · OPTIONAL · DAY 1`) is kept per the
addendum's "keep the old deck's module/day breadcrumb wording" rule — it flags the module's GPU-gated,
optional status, which the plain `MODULE 3B · Containers for GenAI & Agentic AI` breadcrumb used
elsewhere would lose. Every old slide already carried an SVG (no text-only defect slides to backfill).
The nine old-deck `p.takeaway` lines (slides 2–11; slides 1 and 12 never carried one — title/closing
use `.kicker`/`.credit` instead) are removed from the rendered slide and preserved verbatim in the
Takeaway column below — presenter/narration guidance only, never rendered. Zero splits: every old slide
was already one idea. Self-gates (subtitle ≤80 chars, zero `.takeaway` elements, zero external refs, tag
balance, section count = 12, `display:'flex'`/`svg{order:2}` present, headless-Chrome render) all
passed — see the regen's own report for the full gate output.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Customizing Models with LoRA / QLoRA (title) | Module framing: fine-tuning makes the model yours, reproducibly, in a container | Title sketch: a frozen base-model box with a small clip-on adapter box, connector nub between them | credit line: Gourav Shah · School of DevOps & AI · GPU-gated · Hands-on |
| 2 | What you'll learn | Set the four objectives: when to fine-tune, what LoRA does, which tool, why the container matters | Numbered rows (circles 1–4), one objective per row | The output is a small LoRA adapter that plugs straight into serving (M2/M3) and packaging (M4). |
| 3 | The problem: a behaviour gap | Establish the motivating problem — a generalist model that occasionally breaks format is a behaviour gap, not a knowledge gap | Two-panel comparison: dashed gray "generalist + prompt" box (occasionally breaks format) → arrow "fine-tune" → solid ink "specialist" box (always valid JSON) | Fine-tuning teaches new behaviour — style, dialect, reliable output structure — not new facts. |
| 4 | Prompt vs RAG vs fine-tune | The three-way decision: match the tool to the kind of gap, reach for the cheapest one that closes it | Three-column comparison: Prompting (instruction gap) · RAG (knowledge gap) · Fine-tune (behaviour gap) | Knowledge problem → RAG. Reasoning problem → better prompt or bigger base. Behaviour problem → fine-tune. |
| 5 | LoRA — sticky notes on a textbook | The core analogy: freeze the expensive textbook, add small trainable Post-it notes in the margins instead of rewriting it | Big-box anatomy: frozen base-weight box `W` + two small low-rank matrix boxes `A`/`B` → arrow → effective weight box `W + A×B` at inference | Freeze the base, train two tiny matrices, add them at inference. The adapter is ~1–3% of the model. |
| 6 | QLoRA — squeeze the base to 4-bit | Extend LoRA: quantizing the frozen base to 4-bit halves memory again so a 7B model fits one consumer GPU | Before/after: large gray "base in 16-bit" box (too big for one GPU) → arrow "quantize to 4-bit" → compact 4-bit base box + hi-precision adapter box, "7B fits ~24 GB" | QLoRA = LoRA + a 4-bit frozen base — half the memory again, with the adapter kept high-precision. |
| 7 | The open-source toolchain | Map the toolchain split by hardware: NVIDIA gets containerized Axolotl/Unsloth/LLaMA-Factory, Apple Silicon gets native MLX-LM | Two-panel comparison: "NVIDIA (containerized)" box listing three tools over TRL/PEFT vs "Apple Silicon (native)" box listing MLX-LM + unified memory | Axolotl's YAML config is the interface; the pinned Docker image is what makes the run reproducible. |
| 8 | The same GPU reality — again | Reinforce the course's defining constraint in this new context: MLX runs native on Mac, Axolotl runs in a container on NVIDIA, never the reverse | Two-panel: dashed Mac boundary with MLX-LM (native, solid box) above a dashed "container = CPU only" box, vs NVIDIA boundary with Axolotl container box → arrow `--gpus all` → GPU box | A 7B QLoRA fits ~24 GB. On Mac, MLX is the accelerated path — CUDA tools simply don't run in a Mac container. |
| 9 | The frozen container is the experiment | Reproducibility: scripts rot as dependencies drift, but a pinned OCI image does not | Before/after: dashed gray "bare script" box (deps drift, defaults change silently) → arrow "freeze it" → solid ink "pinned image + YAML" box (every dep version locked, tag in GHCR) | YAML in git + image tag in your registry = an immutable, repeatable experiment record. |
| 10 | What you produce: a tiny adapter | Show the concrete artifact — a 50–200 MB adapter directory with two files — and its three destinations | Fan-out: adapter directory box (two file rows) → three gray arrows to three destination boxes: Merge, Hot-load, Package | One adapter, three exits — merge for portability, hot-load for flexibility, package to ship. |
| 11 | The pipeline, end to end | Place fine-tuning as one rung in the pipeline the learner already knows — it feeds serving and packaging | Pipeline with five hop boxes: fine-tune (M3B) → adapter (tiny) → serve (M2/M3) → package (M4) → ship (GHCR) | Nothing new downstream — a fine-tune just adds a custom-behaviour adapter to the pipeline you own. |
| 12 | Two tracks, one destination: a working adapter (closing) | Lab hand-off: both tracks converge on the same measurable outcome | Fan-in: Track A (MLX-LM native · Apple Silicon) and Track B (Axolotl container · NVIDIA) both arrow into one "LoRA adapter" box | Fine-tune the behaviour · keep the base · ship the tiny adapter.; credit + optional-module note + lab hand-off |

<!-- Visual pattern vocabulary (reuse before inventing):
     fan-out · two-panel comparison · big-box anatomy · numbered rows ·
     pipeline with hop-by-hop fragments · hub-and-spoke · staircase/ladder ·
     crossed-out-old → boxed-new -->

## Recommended presentation order

Present strictly 1 → 12. Open on slide 1 to frame this as an optional, GPU-gated module — say so out
loud before slide 2's objectives. Slides 3–4 are the conceptual hinge: linger here, because the
three-way decision (prompt/RAG/fine-tune) is what stops learners reaching for a fine-tune when a better
prompt or RAG would do. Slides 5–6 are one continuous build ("first freeze and add sticky notes, now
squeeze the frozen part") — keep momentum, don't stop between them. Slide 8 deliberately echoes the
GPU-reality slide from earlier modules (M2/M3) — call that back explicitly, it's the course's running
through-line, not a new idea. Under time pressure, compress slide 9 (reproducibility) to one sentence
and slide 10 to "you get a small adapter, three ways to use it" — never compress slides 4, 5, or 8,
which carry the module's three load-bearing decisions.

## Fragment map

All 12 slides are static — none build up hop by hop. This is a concept-comparison deck (three-way
decision, before/after quantization, two-panel toolchain, fan-out destinations, fan-in tracks); every
slide reads better as one coherent picture than as a staged reveal, and the lesson's own diagrams (the
Mermaid graphs) are already static comparisons, not causal sequences. No slide warrants a fragment
build under style-guide §6 ("comparison slides, contract/rule slides, and anatomy slides stay static").

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Close the table with an explicit "no orphans" statement.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing + optional/GPU-gated status | 1 | Title sketch: base model + clip-on adapter; kicker carries "OPTIONAL · DAY 1" |
| Module goal / four learning objectives | 2 | Numbered rows 1–4, mirrors the module-goal blockquote |
| §1 When to fine-tune — the behaviour gap (not knowledge/reasoning) | 3 | Two-panel: generalist+prompt vs specialist, "occasionally breaks format" → "always valid JSON" |
| §1 Prompt vs RAG vs fine-tune three-question decision table | 4 | Three-column comparison, one column per gap type |
| §2 LoRA — sticky-notes-on-a-textbook analogy, frozen base + two low-rank matrices, ~1–3% adapter size | 5 | Big-box anatomy: `W` frozen + `A`/`B` trained → `W + A×B` |
| §2 QLoRA — 4-bit quantized base, halves memory again, fits 7B on one consumer GPU | 6 | Before/after: 16-bit base → quantize → 4-bit base + hi-precision adapter |
| §3 The toolchain — Axolotl, Unsloth, LLaMA-Factory (NVIDIA, wrap TRL/PEFT) vs MLX-LM (Apple Silicon, native, unified memory) | 7 | Two-panel comparison box per hardware track |
| §4 The GPU reality — bitsandbytes/CUDA won't install on macOS, no Mac container accelerates fine-tuning, `--gpus all` on NVIDIA | 8 | Two-panel: Mac (MLX native + dashed disabled container) vs NVIDIA (Axolotl container + GPU) |
| §5 Reproducibility — scripts rot, pinned OCI image doesn't, YAML in git + image tag in GHCR | 9 | Before/after: bare script (drift) → freeze it → pinned image + YAML |
| §6 What you produce — 50–200 MB adapter directory, two files, merge/hot-load/package destinations | 10 | Fan-out: adapter dir → Merge / Hot-load / Package |
| Summary table's pipeline framing — fine-tune → adapter → serve → package → ship | 11 | Pipeline with five hop boxes, each tagged with its module (M3B/M2·M3/M4/GHCR) |
| Closing lab lead-in — Track A (MLX-LM native) / Track B (Axolotl container), both converge on one adapter | 12 | Fan-in: two track boxes → one "LoRA adapter" box |

**No orphans.** Every lesson section (§1–§6), the module-goal blockquote, the summary table's pipeline
framing, and the closing lab lead-in each have a slide. No slide lacks a lesson anchor.
