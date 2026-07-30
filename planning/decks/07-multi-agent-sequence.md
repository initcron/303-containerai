# Module 7 — The Multi-Agent Incident Crew · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate.

     Round-3 regen note: this is an ORIGINAL deck (pre-coursesmith, no prior spec).
     The old deck (`site/static/decks/07-multi-agent.html`, CDN-loaded reveal.js
     4.6.1 + Google Fonts, on-slide `p.takeaway` lines) is the approved coverage
     baseline for this spec — every old slide's concept appears below, 13 slides kept
     1:1, same order, same pagenos. -->

This companion doc maps the 13-slide explainer deck (`site/static/decks/07-multi-agent.html`) to the
Module 7 lesson (`site/docs/m7-multi-agent/lesson.md`). The deck teaches **concepts**, not commands — it
turns each of the lesson's analogies into a hand-drawn whiteboard visual a learner walks through before
opening the lab. The visual language follows the CourseSmith whiteboard style contract
(`coursesmith/templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary /
`#757575` secondary strokes on white paper with the five semantic pastel fills (§1: green good · red
bad/full · blue data · orange caution · purple meta), the `#rough` wobble filter on shapes only, and the
shared `#ah`/`#ahg` arrowhead markers. The arc grows the single M6 agent into a crew — one agent doing
everything → the hospital analogy → the three properties a single agent can't replicate → the boundary
where a single agent is still the right call → the Incident Crew's sequential pipeline and its relevance
gate → the two ways to build a crew (declarative vs framework) → the standard that lets you swap the
orchestrator → the shared model and its real resource cost → wiring the crew into the growing Compose
file → the Reviewer as human-in-the-loop proxy → hand-off to the lab.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | The Multi-Agent Incident Crew (title) | Module framing: one agent grows into a crew of four sharing one model | title scene: Triage → Investigate → Fix → Review pipeline of four boxes | credit line: Gourav Shah · School of DevOps & AI |
| 2 | What you'll learn | Preview the four things this module locks in before the lab | numbered rows (circles 1–4) | the orchestrator changes — the skills, MCP tools, and model stay exactly the same |
| 3 | One agent doing everything gets unfocused | The motivating problem: one overloaded agent vs a clean four-way split | fan-out: one "does everything" circle vs four tight-job boxes | a 1.5B laptop model handles four tight tasks reliably — but not one giant task blindly |
| 4 | A hospital, not a superhero | The analogy: no single doctor greets, diagnoses, prescribes, and countersigns | big-box anatomy: 4 hospital-role boxes (triage nurse/doctor/pharmacist/attending) mapped down onto 4 crew-role boxes | four staff share one health record; four agents share one model endpoint |
| 5 | Three things a single agent can't replicate | The three properties that earn the extra prompts and latency | three-panel row: specialisation / separation / review loop | specialisation, separation of concerns, and a review loop — especially for consequential actions |
| 6 | When is a single agent enough? | The decision boundary — multi-agent adds real overhead, don't reach for it by default | decision diagram: consequential-action question → NO/YES branches to two contract boxes | the M6 single agent is the right tool until an action needs a countersign |
| 7 | The Incident Crew pipeline | The crew's sequential flow and its relevance gate that can short-circuit | pipeline with a diamond gate: Triage → Investigate → gate? → Fixer → Reviewer → APPROVED/ESCALATE | the gate asks one yes/no question so a catastrophically wrong fix never reaches the output |
| 8 | Two paths to multi-agent | Declarative profiles vs an orchestration framework | two-panel comparison: declarative box vs framework (LangGraph/CrewAI) box | reach for a framework when you need deterministic, auditable control over a complex workflow |
| 9 | Swap the orchestrator, not the tools | Three interchangeable orchestrators sit above one shared standards layer | hub/stack: 3 orchestrator boxes → one shared layer of Skills/MCP tools/Guardrails | build against the standard, swap the implementation — the same lesson as the OpenAI-compatible endpoint |
| 10 | One model, four agents | Agents are cheap Python calls; the model is the expensive, shared part | hub-and-spoke: Ollama hub center, 4 agent boxes on spokes | four separate model instances would cost 4× the memory for zero gain — all four call one endpoint |
| 11 | Wire the crew with the Compose Spec | Each agent a lightweight service, all sharing one endpoint, tools, and memory | big-box anatomy: dashed compose.yaml boundary with crew/ToolHive/ChromaDB boxes, arrow out to native Ollama | one growing compose file gains a crew service — reusing the tools and memory you already built |
| 12 | The Reviewer — human-in-the-loop proxy | The Reviewer decides if the fix is safe to show a human, not whether to fix it | fan-out: Reviewer box → APPROVED/REJECTED outcome boxes → Human decides box | the crew produces a vetted recommendation; the human engineer retains final authority |
| 13 | Swap the orchestrator, keep the crew (closing) | Hand off to the lab: run both incidents, watch the relevance gate work | pipeline scene: Triage → Investigate → Fix → Review, branching to 503→APPROVED and Kafka→ESCALATE | read the four profiles, run both incidents, watch the relevance gate work; credit + lab hand-off |

<!-- Visual pattern vocabulary used above (reuse before inventing):
     fan-out (3, 5 as three-panel row, 12) · two-panel comparison (8) ·
     big-box anatomy (4, 11) · numbered rows (2) · pipeline (1, 7, 13) ·
     decision diagram (6) · hub-and-spoke (9, 10) -->

## Recommended presentation order

Present strictly 1 → 13; each slide's vocabulary is used by the next. Open on the title scene (1) and the
four-idea preview (2) to set expectations. Slide 3 is the motivating problem — linger on it, because "one
agent gets unfocused" is the gap every later slide fills. Slides 4–5 are one continuous build-up on the
analogy: slide 4 lands the hospital scene, slide 5 turns it into the concrete three properties
(specialisation, separation, review loop) — present these two back to back. Slide 6 is the conceptual
hinge worth slowing down on — the boundary between "M6 is enough" and "reach for a crew" is the decision
every learner must internalize before the lab; do not rush it. Slide 7 is the second hinge — the
Incident Crew's own pipeline and its relevance gate — walk it hop by hop verbally even though the slide
is static; make the "NO runbook found → escalate" short-circuit land explicitly. Slides 8–9 are a matched
pair on the two build paths and the standard that makes them interchangeable — present together, and be
explicit at slide 9 that this is the same build-against-the-standard lesson as the OpenAI-compatible
endpoint from earlier modules. Slide 10 (resource budget) and slide 11 (Compose wiring) are a mechanics
pair — compress under time pressure if needed, but keep the "4× memory for zero gain" number audible.
Slide 12 (the Reviewer) is an independent single-concept slide — present at normal pace. Slide 13 hands
off to the lab — say the closing line and stop talking, let the lab do the proving.

## Fragment map

This deck carries no build-ups from the original authoring — every slide (including the multi-box
slides: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13) is presented as a single static, already-complete picture.
This matches the old deck's own construction (no `fragment` classes existed in the CDN-era HTML) and
suits the content: slide 6 is a decision contract that reads better whole, slide 7 is a pipeline diagram
meant to be read at a glance, and 4/9/10/11 are anatomy/hub-and-spoke layouts intended to be read as one
complete picture rather than revealed hop-by-hop. No fragments were added in the round-3 regen — a future
revision could fragment slide 7 (Triage → Investigate → gate → Fixer/Reviewer → outcome) or slide 10
(Ollama hub → each agent spoke added one at a time) if a presenter wants a build, but the current spec
keeps parity with the approved baseline.

Static slides (all of 1–13): read in full on entry — no reveal-in-steps behavior in this deck.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Baseline = the OLD deck (13 slides); confirming no orphans
against both the lesson and the prior deck.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing / what you'll learn | 1, 2 | title scene (four-role pipeline sharing one model) + numbered-rows preview of all four learning objectives |
| §1 The hospital analogy — triage nurse, doctor, pharmacist, attending physician; no single doctor does everything; one shared health record | 3, 4 | slide 3 = the motivating "one agent gets unfocused" problem; slide 4 = big-box anatomy mapping the four hospital roles onto the four crew roles |
| §2 Why multi-agent — specialisation, separation of concerns, review loops | 5 | three-panel row: one box per property, with its own supporting detail lines |
| §2 When is a single agent enough — one use case end-to-end, no separate safety review, no consequential action | 6 | decision diagram: consequential-action question branching to a single-agent contract box or a reach-for-a-crew contract box |
| §3 The incident crew's pipeline — sequential stages, the relevance gate, the Kafka/payments-runbook near-miss, the NO-runbook escalate short-circuit | 7 | pipeline with a diamond gate: Triage → Investigate → gate? → Fixer → Reviewer → APPROVED/ESCALATE |
| §4 Two paths — declarative (four Markdown profiles + one Python pipeline, stdlib only) vs framework (CrewAI role-based, LangGraph graph + checkpointing) | 8 | two-panel comparison: declarative box (profiles + pipeline) vs framework box (LangGraph/CrewAI) |
| §4 The standards converge — MCP, ChromaDB, Ollama are the same across declarative and framework crews; build against the standard, swap the implementation | 9 | hub/stack: three interchangeable orchestrator boxes sitting above one shared Skills/MCP tools/Guardrails layer |
| §5 One model, four agents — the resource table (~1 GB model, ~200 MB ChromaDB, ~50 MB crew container, ~1.3 GB total); agents are cheap, the model is shared; four separate instances would cost 4× | 10 | hub-and-spoke: Ollama hub at center (native, ~1 GB), four agent boxes on spokes, resource total as a caption |
| §5 The crew wired as Compose services — reuses the tools and memory already built, model server stays native, containers reach it over host.docker.internal | 11 | big-box anatomy: dashed compose.yaml boundary holding crew/ToolHive/ChromaDB boxes, arrow out to the native Ollama model-server box across `:11434` |
| §6 The Reviewer as human-in-the-loop proxy — decides if the fix is safe to show a human (not whether to fix); APPROVE if non-destructive + verbatim runbook, REJECT if destructive/secrets/ungrounded, when in doubt REJECT; human retains final authority | 12 | fan-out: Reviewer box → APPROVED/REJECTED outcome boxes → Human-decides box |
| Summary table — multi-agent crew, why multi-agent, when one agent is enough, declarative crew, CrewAI, LangGraph, one shared model, relevance gate, Reviewer, standards converge | 5, 6, 7, 8, 9, 10, 12 | the summary table's ten rows are each already covered by their own dedicated slide above — no separate summary slide needed, avoiding a redundant orphan-free repeat |
| Closing hand-off — read the four profiles, run the 503 incident to APPROVED, run the Kafka incident to ESCALATE, watch the relevance gate | 13 | pipeline scene: Triage → Investigate → Fix → Review, branching to 503→APPROVED and Kafka→ESCALATE |

**No orphans.** All 13 old-deck slides and all lesson §1–§6 concepts (the hospital analogy, why
multi-agent, the single-agent boundary, the Incident Crew's pipeline and relevance gate, the two build
paths and their converging standards, the one-model resource budget, the Compose wiring, and the
Reviewer's human-in-the-loop role) are covered above with an explicit slide mapping. Slide count, order,
and pagenos (`M7·01`–`M7·13`) are kept 1:1 with the approved old-deck baseline — no splits were required;
every old slide already carried exactly one idea and already had its own SVG scene, so the round-3
"text-only slide is a defect" rule did not trigger anywhere in this deck.
