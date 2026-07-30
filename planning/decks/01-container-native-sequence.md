# Module 1 — Container-Native GenAI · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate.

     Round-3 regen note: this is an ORIGINAL deck (pre-coursesmith, no prior spec).
     The old deck (`site/static/decks/01-container-native.html`, CDN-loaded reveal.js
     4.6.1 + Google Fonts) is the approved coverage baseline for this spec — every old
     slide's concept appears below, 13 slides kept 1:1, same order, same pagenos. -->

This companion doc maps the 13-slide explainer deck (`site/static/decks/01-container-native.html`) to the Module 1 lesson (`site/docs/m1-container-native/lesson.md`). The deck teaches **concepts**, not commands — it turns each of the lesson's analogies into a hand-drawn whiteboard visual a learner walks through before opening the lab. The visual language follows the CourseSmith whiteboard style contract (`coursesmith/templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary / `#757575` secondary strokes on white paper with the five semantic pastel fills (§1), the `#rough` wobble filter on shapes only, and the shared `#ah`/`#ahg` arrowhead markers. The arc moves vocabulary forward — the Docker-pricing shock → container-native as the open standard → what containers buy an AI stack → the Apple-Silicon GPU constraint and its fix → the OpenAI-compatible endpoint as universal contract → the 2026 declarative-vs-orchestration map → the Acme use case and the build ladder → hand-off to the lab.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Container-Native GenAI (title) | Module framing: the open standard, not Docker, is the through-line | title sketch: one AI-labelled shipping container fans out to four runtime carriers (Colima, Rancher, OrbStack, Podman) | credit line: Gourav Shah · School of DevOps & AI |
| 2 | Five ideas carry the rest of the course | Preview the five concepts this module locks in before every later lab | numbered rows (circles 1–5) | concepts first — the lab then proves the container-to-native-model wiring with your own hands |
| 3 | The assumption that just broke | Docker Desktop's licensing change (250 staff / $10M revenue) broke "container = Docker", not the standard underneath | crossed-out-old ("container = Docker Desktop") → boxed-new ("container = the open OCI standard"), pricing fact as a label on the arrow | the standard under Docker was always open — this module builds on that standard, not on any one vendor |
| 4 | Container-native, not Docker-native | The shipping-container analogy: one `compose.yaml` runs unmodified on four different runtimes | fan-out: `compose.yaml` box → 4 runtime boxes → converge to "same app, identical containers" | one file, four runtimes, same result — the carrier you pick is your business, not the course's |
| 5 | What containers buy an AI stack | Four concrete jobs a container does for every AI component: package, serve, isolate, ship | big-box anatomy: 4 side-by-side sealed boxes, each titled and with 3 detail lines | package, serve, isolate, ship — the four jobs a container does for every piece of your AI stack |
| 6 | Guest rooms with no power outlets | The Apple-Silicon GPU reality: Hypervisor.framework exposes no virtual GPU, so containerized models fall back to CPU (3–6× slower) | two-panel scene: "the building" (mains = Metal GPU) vs dashed "guest rooms" (containers, no outlet) → CPU-fallback box with the 3–6× fact as a label | the single most important practical lesson: get this wrong and every lab crawls — so don't fight it, wire around it |
| 7 | Native server, containerized everything else | The universal Mac pattern: Ollama runs natively on Metal; app, agent, and vector DB run in containers, bridged via `host.docker.internal:11434` | dashed host boundary containing a native Ollama box + a container-runtime boundary with 3 inner service boxes, arrow labelled with the bridge hostname | on Windows + WSL2 + NVIDIA the toolkit passes the GPU in, so the server *can* be containerized there |
| 8 | One universal contract: the OpenAI-compatible endpoint | The wall-socket analogy: Ollama, vLLM, and llama.cpp all expose `/v1/chat/completions`; the app code never changes | fan-out: 3 engine boxes → one socket box labelled with the endpoint path → "your app/agent, code never changes" | the same request runs against Ollama on a laptop, vLLM on a GPU VM, or OpenAI — every lab speaks this language |
| 9 | The 2026 map: declarative vs orchestration | Two ways to build an agent; start with the light one, add the heavy one only when the task demands hard sequencing | two-panel comparison: declarative-agents box vs orchestration box, arrow between labelled "add only when needed" | the rule: start declarative; add orchestration only when the task has hard sequencing you can't express in tools |
| 10 | Anatomy of a declarative agent | Four plain-file parts fully define an agent, no framework code required | big-box anatomy: outer "declarative agent" box with 4 inner boxes (identity files, SKILL.md, MCP tools, guardrails) | identity, skills, tools, guardrails — all in files you can read, diff, and version like any other code |
| 11 | Meet Acme — two connected tools | Introduce the running case study: Day-1 Docs Assistant feeds Day-2 Support Agent → Incident Crew | pipeline: runbooks box → Day-1 Docs Assistant box → "used as a tool" → Day-2 Support Agent/Incident Crew box | Use Case B *uses* Use Case A as one of its tools — skills compound instead of tangling |
| 12 | The build ladder — one step per module | Every module adds exactly one rung to the same growing `compose.yaml`, from M1's bare model call to the Capstone | staircase/ladder: 7 rising steps (M1–M7) + a tall M8/Capstone column, day-1/day-2 span labels beneath | Module 1 is step 0: a runtime and a model responding to a call — you hand-author every block from here |
| 13 | Build it once. Run it anywhere. (closing) | Hand off to the lab: the learner will prove the container→native-model wiring themselves | scene: dashed "throwaway container" box ↔ solid "Ollama, native · Metal GPU" box, bidirectional arrows labelled with the bridge host and "a real response back" | in the lab you'll prove this wiring yourself — container calls native model, and it answers; credit + lab hand-off |

<!-- Visual pattern vocabulary used above (reuse before inventing):
     fan-out (1, 4, 8) · two-panel comparison (6, 9) · big-box anatomy (5, 10) ·
     numbered rows (2) · pipeline (11) · staircase/ladder (12) ·
     crossed-out-old → boxed-new (3) · scene/hand-off (13) -->

## Recommended presentation order

Present strictly 1 → 13; each slide's vocabulary is used by the next. Open on the title sketch (1) and the five-idea preview (2) to set expectations, then land the motivating shock immediately: slide 3 (the Docker pricing change) is the conceptual hinge that makes "container-native" a *claim worth making* rather than a rebrand — linger on it and be explicit that this is a pricing change, not a technical one. Slides 3–5 are one continuous build-up on the open-standard idea — announce "the standard was always open" at slide 3 and keep momentum through 5 (what that standard buys you). Slide 6 is the second hinge and arguably the most consequential slide in the whole module: the Apple-Silicon GPU constraint is the one fact that, if missed, makes every later lab feel broken — slow down, use the guest-room analogy fully, and don't rush to slide 7's fix. Slides 6–7 are a matched pair (problem → fix); present them back to back. Slide 8 generalizes the fix into the OpenAI-compatible-endpoint contract that recurs all course long — call forward explicitly ("every lab from here speaks this language"). Slides 9–10 are a signpost pair for M6/M7, lighter-touch — compress these under time pressure if needed, but never compress 3, 6, or 7. Slide 11 introduces the running case study; slide 12 zooms out to the whole-course roadmap it sits inside. Slide 13 hands off to the lab — say the closing line and stop talking; let the lab do the proving.

## Fragment map

This deck carries no build-ups from the original 303 authoring — every slide (including the multi-box slides: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12) is presented as a single static, already-complete picture. This matches the old deck's own construction (no `fragment` classes existed in the CDN-era HTML) and suits the content: slides 3–4 and 6–7 are comparison/contract pairs that read better whole, and 5/9/10/11/12 are anatomy/comparison/pipeline layouts intended to be read at a glance rather than revealed hop-by-hop. No fragments were added in the round-3 regen — a future revision could fragment slide 7 (native box → bridge arrow → container box) or slide 12 (ladder rising one step at a time) if a presenter wants a build, but the current spec keeps parity with the approved baseline.

Static slides (all of 1–13): read in full on entry — no reveal-in-steps behavior in this deck.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Baseline = the OLD deck (13 slides); confirming no orphans against both the lesson and the prior deck.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing / five things you'll learn | 1, 2 | title scene (shipping container → 4 runtimes) + numbered-rows preview of all five ideas |
| §1 Container-Native, Not Docker-Native — the Docker Desktop pricing change | 3 | crossed-out-old → boxed-new; the $10M/250-staff fact is now a label ON the diagram (relocated from the old subtitle per the round-3 subtitle-length rule) |
| §1 The shipping-container analogy; OCI + Compose Spec run on 4 runtimes | 4 | fan-out: one `compose.yaml` → Colima/OrbStack/Rancher/Podman → identical containers |
| §2 What Containers Buy an AI Stack — package / serve / isolate / ship | 5 | big-box anatomy, 4 sealed boxes with the "hermetically sealed shipment" analogy in the subtitle |
| §3 The Apple Silicon GPU Reality — Hypervisor.framework, no virtual GPU, 3–6× CPU slowdown | 6 | guest-rooms-with-no-outlets analogy; the 3–6× fact lives in the SVG label |
| §3 The universal Mac pattern — native Ollama + containerized app/agent/vectorDB, `host.docker.internal:11434` | 7 | host-boundary + container-boundary two-region diagram; bridge hostname as an SVG label |
| §3 Windows + WSL2 + NVIDIA exception (GPU passthrough) | 7 | carried as the slide's Takeaway (presenter narration), not re-diagrammed — a second exception diagram would be a two-idea slide; the exception is a one-line forward-looking caveat, appropriately spoken rather than drawn |
| §6 The OpenAI-compatible endpoint — wall-socket analogy, `/v1/chat/completions` | 8 | fan-out: 3 engines → 1 socket → unchanging app code |
| §4 The 2026 map: declarative agents (M6) vs orchestration frameworks (M7) | 9 | two-panel comparison with "add only when needed" rule between |
| §4 Anatomy of a declarative agent — AGENTS.md/SOUL.md, SKILL.md, MCP tools, guardrails | 10 | big-box anatomy, 4 inner boxes |
| §5 The Acme use case — Docs Assistant (Day 1) used as a tool by the Support Agent → Incident Crew (Day 2) | 11 | pipeline: runbooks → Docs Assistant → "used as a tool" → Support Agent/Incident Crew |
| §5 The build ladder — one `compose.yaml` service per module, M1 → Capstone | 12 | staircase/ladder, 7 steps + tall Capstone column, Day 1 / Day 2 span labels |
| Closing hand-off — the lab proves container ↔ native-model wiring | 13 | scene: dashed throwaway container ↔ solid native Ollama box, bidirectional bridge arrows |

**No orphans.** All 13 old-deck slides and all lesson §1–§6 concepts (container-native framing, the Docker pricing shock, the OCI/Compose Spec fan-out, package/serve/isolate/ship, the Apple-Silicon GPU constraint and its native-server fix, the OpenAI-compatible endpoint contract, the declarative-vs-orchestration map, the Acme use case, and the build ladder) are covered above with an explicit slide mapping. Slide count, order, and pagenos (`M1·01`–`M1·13`) are kept 1:1 with the approved old-deck baseline — no splits were required; every old slide already carried exactly one idea and already had its own SVG scene, so the round-3 "text-only slide is a defect" rule did not trigger anywhere in this deck.
