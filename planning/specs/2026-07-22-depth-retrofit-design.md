# Depth Retrofit — Design Spec

**Date:** 2026-07-22 · **Status:** Approved approach (A), spec under review
**Driver:** Workshop participants want deeper dives (esp. fine-tuning parameters — what we set, how it works, why). Upcoming workshop < 2 weeks away → repeatable automated testing lands first.

## Goals

1. **Safety first:** the whole existing course is automatically testable before every workshop (checks + cold learner-QA), verified on an independent staging deploy.
2. **Depth:** "Deep Dive (Part 2)" tier for the four modules participants asked about most: **M3B fine-tuning → M3 vLLM → M5 RAG → M7 agents** (in that priority order).
3. **Adopt coursesmith features** (deep-dive-author, deck-author + illustration-author, lab-validation + checks.json, learner-qa, sim-author, live-tool) **without touching the existing 11 decks or working content**.

## Non-goals (this milestone)

- Breadth modules (LLM observability & evals; agent sandboxing & runtimes) — **parked**, next milestone. `course.config.json` written now so they can use `/course-module` natively later.
- Narration kits / video production — deferred.
- Regenerating or editing any existing deck — forbidden. New decks only.
- Full Slice-H pipeline conformance / repo restructure — cherry-pick skills instead.

## Constraints (locked)

- Existing 11 decks in `site/static/decks/` stay **byte-identical**. Deep-dive content gets **new, separate** `<id>-deepdive.html` decks following the coursesmith whiteboard style guide (reveal.js inlined, Patrick Hand data-URI, five-pastel palette, zero external refs).
- Existing lesson/lab/quiz pages change only when QA finds a real defect.
- Machine budget: arm64, 16 GB — every lab (incl. deep-dive experiments) ≤ ~4–6 GB peak. Fine-tuning experiments stay on MLX + small models (as M3B already does).
- Model server native on Apple Silicon; containers reach it at `host.docker.internal:11434`.
- Quiz component schema, admonition bracket form, analogy + Mermaid lesson conventions all still apply to new pages.

## Architecture — staging via fork

```
local feature branch ──push──> fork main (initcron/303-containerai)
                                  │  fork Actions run deploy.yml
                                  ▼
                    https://initcron.github.io/303-containerai/   ← QA target
                                  │  learner-QA PASS + checks green
                                  ▼
                    merge → origin main (schoolofdevops) → live site
```

- Remote `fork` = `https://github.com/initcron/303-containerai.git` (added 2026-07-22).
- Enable Pages on fork: `gh api -X POST repos/initcron/303-containerai/pages -f build_type=workflow` (as `initcron`, who owns it).
- No Docusaurus config change: `baseUrl` `/303-containerai/` identical on both hosts; canonical URLs still point at schoolofdevops — acceptable for staging.
- Risk: if `deploy.yml` ever needs edits, pushing workflow files needs a token with `workflow` scope (see STATE.md gotcha).

## Phase 1 — testing backbone (MUST land before workshop)

1. **Vendor the checks runner:** copy coursesmith `scripts/run-checks.mjs` (zero-dep Node) → `scripts/run-checks.mjs`.
2. **Author `labs/<id>/checks.json`** for `m1 m2 m3 m3b m4 m5 m6 m7 m8 capstone`. Assertions derive from each lab's documented success end-state. Schema per coursesmith `templates/checks.schema.json`: `{id, describe, run, assert}` with assert kinds `exit | contains | matches | absent` (regex `m`-flag, state-tolerant — tolerate restarts, ordering, trailing output).
3. **Live re-validation:** run every lab on Rancher Desktop via coursesmith lab-validation flow (probe env once → lab-runner agent per module → fold real output drift back into lab.md → checks green). Refresh `planning/lab-tests/*.md` evidence.
4. **One-command smoke test:** `scripts/test-course.sh` — iterates modules, runs each checks.json (with `PATH="$HOME/.rd/bin:$PATH"`, `DOCKER_HOST` for thv where needed), prints per-module ✅/❌ + summary, exit non-zero on any failure. This is the pre-workshop ritual.
5. **Write `course.config.json`** (against coursesmith `templates/course.config.schema.json`) describing this course as-built — cheap now, unlocks `/course-module` for future breadth modules.
6. **Full learner-QA sweep** (coursesmith:learner-qa): fresh cold-learner agent walks every published page **on the fork site** in sidebar order, executes every command verbatim, tests module→module seams. Record-don't-fix report → author fixes → re-run until every page verdict PASS.

**Exit criteria:** fork site deployed green; `test-course.sh` all-green with captured evidence; whole-course learner-QA report all-PASS.

## Phase 2 — deep dives (priority order M3B → M3 → M5 → M7)

Per module, the deliverable set (via coursesmith deep-dive-author + deck-author + illustration-author + lab-validation + learner-qa):

- `site/docs/<id>/deep-dive.md` — sidebar_position 4, label "Deep Dive (Part 2)". Advanced bar: never re-teach basics; ≥1 Mermaid; analogy for each NEW concept; Expected-output fold-pairing; "Where you will use this" close; Teardown.
- `labs/<id>/deep-dive.checks.json` — separate from core checks.
- `site/static/decks/<id>-deepdive.html` — NEW deck, whiteboard style guide, spec-first via `planning/decks/<id>-deepdive-sequence.md` (zero-orphan coverage gate), with hand-drawn SVG scene illustrations (illustration-author) inline.
- Embedded in deep-dive.md via existing `Slides` component (same pattern lessons use).
- Live-validated + checks green + learner-QA PASS on fork before merge to origin.

### Content maps

**M3B — Fine-tuning under the hood** (biggest ask; first):
- LoRA math: what rank `r` controls (adapter capacity), `alpha` scaling (`alpha/r` ratio), which `target_modules` and why (attention projections), dropout.
- QLoRA: 4-bit NF4 quantization intuition, double quantization, why frozen-base + fp16 adapters works.
- Training dynamics: learning rate + schedule, epochs vs overfitting signs (loss curves, memorization), batch size vs gradient accumulation trade-off on 16 GB.
- Data: chat-template/dataset formats, why format mismatch silently ruins results.
- Evaluating the tuned model; when to fine-tune vs RAG vs prompt.
- **Experiment:** re-run the M3B MLX training with 2–3 parameter variants (e.g. r=4 vs r=16; lr high vs low), compare loss + generations side by side. Memory-budgeted.

**M3 — vLLM internals:**
- PagedAttention: KV cache as paged virtual memory (analogy-first), why it beats contiguous allocation.
- Continuous batching vs static batching.
- What our lab flags actually did: `dtype float32` (why bf16 failed on this CPU path), `swap-space`, `max-model-len`, CPU cap.
- **Experiment:** small throughput/latency comparison vLLM-CPU vs Ollama on same prompt set.

**M5 — RAG parameters:**
- Chunk size & overlap trade-offs; top-k; similarity metric; embedding model choice; context-window budget arithmetic.
- **Experiment:** re-ingest corpus with different chunking + top-k, ask fixed question set, compare retrieved context + answers.

**M7 — Agent knobs:**
- Temperature, max iterations, tool-loop control, delegation between agents, guardrail placement.
- **Experiment:** run Incident Crew with knob variants, observe behavior/latency/quality shifts.

## Phase 3 — enrichments (time-permitting; else post-workshop)

- **Sims (sim-author):** two hero sims, self-contained HTML in `site/static/sims/`, embedded fullscreen, with headless assertion harness:
  1. LoRA trade-off sim — dials for rank/lr/epochs → loss curve + quality/memory gauges.
  2. RAG retrieval sim — chunking/top-k dials → which context reaches the model.
- **Live-tool (live-tool skill):** "Container X-Ray" at `labs/tools/container-xray/` — local visualizer of the learner's real docker/compose state; one lens per module (containers/ports, model endpoints, volumes, compose services).
- Both optional-by-time; never block workshop readiness.

## Verification gates

| Gate | Check |
|---|---|
| Per lab | `node scripts/run-checks.mjs labs/<id>/checks.json` green; evidence in `planning/lab-tests/` |
| Per page | `npm run build` green; learner-QA verdict PASS on fork deploy |
| Pre-merge to origin | Full `scripts/test-course.sh` green + module QA PASS |
| Release | CHANGELOG.md updated; semver tag; origin push; live-site spot check |

## Process

- Superpowers end-to-end: this spec → writing-plans → subagent-driven execution; TDD-equivalent for course = checks-first where sensible (write checks.json from lab prose, then validate live).
- Update `planning/STATE.md` + `planning/ROADMAP.md` after every task.
- Commits authored `initcron <bean@initcron.org>`; commit after each task.

## Parking lot

- Breadth modules: LLM observability & evals (containerized Langfuse/OTel over the RAG/agent stack); agent sandboxing & runtimes (gVisor/microVMs, extends M8).
- Narration kits via narration-author + gourav-voice.
- GHCR real-push task (still blocked on `write:packages` — pre-existing).
