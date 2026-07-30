# Module 2 — Serving Local Models · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate.

     ADDENDUM (wave 2, original deck): this deck had no spec — it was authored
     pre-coursesmith and loaded reveal.js 4.6.1 + Patrick Hand from CDNs. This spec
     is authored retroactively, using the OLD deck (`site/static/decks/02-serving.html`,
     12 slides) as the approved coverage baseline. Slide order & count kept 1:1 — no
     slide in the old deck is a genuine two-idea defect, so no splits. -->

This companion doc maps the 12-slide explainer deck (`site/static/decks/02-serving.html`) to the
Module 2 lesson (`site/docs/m2-serving/lesson.md`). The deck teaches **concepts**, not commands — it
turns the lesson's espresso-machine and wall-socket analogies, plus the JPEG/GGUF analogy, into
hand-drawn whiteboard visuals a learner walks through before opening the lab. The visual language
follows the CourseSmith whiteboard style contract (`templates/deck/whiteboard-style-guide.md`):
Patrick Hand cursive, `#1e1e1e` primary / `#757575` secondary strokes on white paper with the five
semantic pastel fills (§1: green good · red bad/full · blue data · orange caution · purple meta), the
`#rough` wobble filter on shapes only, and the shared `#ah`/`#ahg` arrowhead markers. The arc moves
vocabulary forward — **many engines, one contract → pick an engine → size a model → wire the app two
ways**.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Serving Local Models (title) | Module framing: several engines, one socket, one app plugs in | Title sketch: fan-out (3 engine boxes → `/v1` socket → app box) | credit line: Gourav Shah · School of DevOps & AI · Hands-on |
| 2 | What you'll learn | Module framing: the five things this deck + lab lock in | Numbered rows (5 circles) | One app, many backends — the serving engine becomes a deployment choice, never a code change |
| 3 | The problem: every engine speaks differently? | Motivate the contract by showing the pain it removes | Fan-out, dashed/tangled: app → 3 engines, each with its own SDK/URL | Three custom integrations is three ways to break — the fix is one shared contract |
| 4 | The quick demo: Docker Model Runner | Docker's built-in one-command server, and why the course goes further | Pipeline: command box → arrow → 3-step result stack | Slickest on-ramp inside Docker — but this course goes runtime-agnostic so patterns run anywhere |
| 5 | Open engines: different machines, same cup | The espresso analogy — engines differ inside, all pour into one API | Scene: 3 machines fan into one cup | Swap the machine under the counter — no barista, and no app, needs retraining |
| 6 | Which engine, when | Match Ollama / llama.cpp / LocalAI to their best-fit job | Big-box anatomy: 3-row comparison table | For development, Ollama is the standard; M3 adds vLLM for high-throughput GPU serving |
| 7 | The universal contract: the /v1 endpoint | The wall-socket analogy — the contract itself, made concrete | Fan-out: 3 engines → socket → app plug | Two endpoints — chat/completions and models. The app talks to the contract, not the engine |
| 8 | Swap engines by changing one variable | `OPENAI_BASE_URL` is the single switch across dev/staging/prod | Fan-out: one variable box → 3 environment boxes | Move a 1.5B dev model to a 13B production model — the application does not notice |
| 9 | GGUF: the JPEG of model weights | The quantization analogy — compact format that fits laptop RAM | Pipeline: big RAW box → quantize arrow → small GGUF box → rule box | Ollama pulls GGUF, not float16 — so laptop CPU and Metal run it without CUDA |
| 10 | Picking a model for a 16 GB laptop | Concrete model-size table sized to the reference laptop | Big-box anatomy: 5-row model/size/use table | Stay on qwen2.5:1.5b for every lab; gpt-oss 20B is demo-only |
| 11 | Two wiring patterns, one app | Mac-native vs GPU-host-container wiring, same app code | Two-panel comparison: Pattern A (dashed boundary) vs Pattern B (dashed boundary) | Build once on your laptop; the same image drops onto a Linux GPU VM with one config change |
| 12 | The engine is a deployment choice, not a code choice (closing) | Big-idea recap + hand-off to the lab | Closing sketch: fan-out (engine/hardware → contract socket → app, "plugged in once") | credit + lab hand-off: continue to the Serving lab |

<!-- Visual pattern vocabulary (reuse before inventing):
     fan-out · two-panel comparison · big-box anatomy · numbered rows ·
     pipeline with hop-by-hop fragments · hub-and-spoke · staircase/ladder ·
     crossed-out-old → boxed-new -->

## Recommended presentation order

Present strictly 1 → 12; each slide's vocabulary is used by the next. Open on slide 1 as pure
orientation — don't linger. Slides 2–3 are a fast warm-up: state the five objectives, then let
slide 3's tangle of dashed lines land as the pain point before the fix arrives. Slide 4 (Docker Model
Runner) is a one-breath aside — it exists so learners who already know Docker aren't surprised it's
not the course's path; do not let it become the main event. **Slides 5–8 are the conceptual spine and
deserve the most air**: 5 (espresso analogy) is the hinge worth lingering on — once the cup lands,
slides 6–8 (engine picker, wall socket, one variable) move quickly because the mental model is already
installed. Slide 9 (GGUF/JPEG) is a second hinge — a fresh analogy, give it its own breath before
sliding into 10 (model table, read quickly, it's reference material learners will revisit from the
page). Slides 11–12 close the loop: 11 is the payoff made concrete (two patterns, one app), 12 is the
big-idea restatement — say the title line aloud, then hand off to the lab. Under time pressure,
compress 4 and 10 (they're reference, not conceptual); never compress 5, 7, or 9 — those are the
three analogies the rest of the course depends on.

## Fragment map

This deck ships with **no fragments** — every slide in the old deck was authored as a single static
picture, and each slide teaches one coherent idea in one view (fan-outs, tables, and two-panel
comparisons read better whole per style-guide §6). Slides 1–12 are all static.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Close the table with an explicit "no orphans" statement.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing / objectives | 1, 2 | Title fan-out previews the whole arc; slide 2 is the five-objective numbered list from the lesson's module goal |
| §1 Docker Model Runner (`docker model run`) | 4 | One-command demo, positions the course's runtime-agnostic choice against it |
| Motivation for a shared contract (implicit — why engines need one API) | 3 | Authored fan-out showing the tangle of custom SDKs a shared contract removes; echoed by 7 |
| §2 Open engines: Ollama, llama.cpp, LocalAI (table + espresso analogy) | 5, 6 | 5 = espresso-machine analogy scene; 6 = the engine-fit table, same three engines |
| §3 The OpenAI-compatible endpoint / wall-socket analogy / two endpoints | 7 | Wall-socket scene carries both the `/v1` socket image and the "two endpoints" fact as SVG labels |
| §3 `OPENAI_BASE_URL` swap across dev/staging/production | 8 | Fan-out from one variable to three named environments, each environment's hostname kept as an SVG label |
| §4 GGUF / quantization / JPEG analogy / sizing rule | 9 | Pipeline: RAW → quantize → GGUF, sizing rule boxed alongside |
| §4 Model selection table for a 16 GB laptop | 10 | Big-box table ported verbatim (model / size / course use) |
| §5 Two wiring patterns (Mac native vs GPU-host container) | 11 | Two-panel comparison, each pattern's env var + hostname kept as SVG labels |
| Big idea / summary / hand-off to lab | 12 | Closing fan-out restates "deployment choice, not code choice"; credit line hands off to the Serving lab |

**No orphans.** Every concept section of `site/docs/m2-serving/lesson.md` (Docker Model Runner, the
three open engines + espresso analogy, the `/v1` universal-contract wall-socket analogy plus its two
endpoints, the `OPENAI_BASE_URL` swap across environments, GGUF/quantization plus the JPEG analogy and
sizing rule, the model-selection table, and the two wiring patterns) has a slide. No slide lacks a
lesson anchor. The old deck's 12 slides map 1:1 onto the new deck; no splits were required.
