# Module 6 — The Declarative Agent · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate.

     Round-3 regen note: this is an ORIGINAL deck (pre-coursesmith, no prior spec).
     The old deck (`site/static/decks/06-declarative-agent.html`, CDN-loaded reveal.js
     4.6.1 + Google Fonts, on-slide `p.takeaway` lines) is the approved coverage
     baseline for this spec — every old slide's concept appears below, 14 slides kept
     1:1, same order, same pagenos. -->

This companion doc maps the 14-slide explainer deck (`site/static/decks/06-declarative-agent.html`) to
the Module 6 lesson (`site/docs/m6-declarative-agent/lesson.md`). The deck teaches **concepts**, not
commands — it turns each of the lesson's analogies into a hand-drawn whiteboard visual a learner walks
through before opening the lab. The visual language follows the CourseSmith whiteboard style contract
(`coursesmith/templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary /
`#757575` secondary strokes on white paper with the five semantic pastel fills (§1: green good · red
bad/full · blue data · orange caution · purple meta), the `#rough` wobble filter on shapes only, and the
shared `#ah`/`#ahg` arrowhead markers. The arc moves from problem to proof — naive RAG's blind
retrieval → the onboarding-a-new-hire analogy → an agent's anatomy in five Markdown/tool parts →
declarative-vs-hand-coded contract → the decide-first agentic-RAG loop → routing proven on a small
model → real tools wired in through an isolated MCP gateway → hard guardrails that fire before the
model runs → long-term memory reused from M5 → the whole agent packaged as one container → hand-off to
the lab.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | The Declarative Agent (title) | Module framing: an agent you write down, not code up | title scene: container boundary holding a labelled "Aria" core box, fed by SOUL.md/AGENTS.md on one side and SKILL.md/MCP tools on the other | credit line: Gourav Shah · School of DevOps & AI |
| 2 | What you'll learn | Preview the five things this module locks in before the lab | numbered rows (circles 1–5) | the agent IS Markdown + skills + tools — minimal glue, shipped inside a container |
| 3 | Naive RAG is passive — it always retrieves | M5's pipeline has no judgment: every question takes the same road | two-panel-style fan-out: an ops question and a trivia question both forced through the same embed→retrieve→generate pipe to "answer" | naive RAG can't decide, can't route, can't use tools — it only ever retrieves-then-generates |
| 4 | Onboard an engineer — don't script a robot | The analogy: you hand a new hire three documents, not a flowchart | big-box anatomy: job-desc / rulebook / skill-guides boxes converging into a "model = engineer" box | write the three documents as Markdown; the model reads them and becomes the engineer |
| 5 | The anatomy of a 2026 agent | Five labelled parts — persona, instructions, skill, tools, guardrails — plus minimal glue | fan-out: 5 stacked file boxes → `agent.py` glue box → "Aria runs" box | no framework, no class hierarchy — just Markdown read at startup and stitched into the system prompt |
| 6 | Declarative Markdown vs a hand-coded robot | Changing tone or adding a guardrail is an edit, not a code change | two-panel comparison: dashed "hand-coded robot" box vs solid "declarative agent" box | declarative vs framework is decided up front — one agent + clear rules stays Markdown; frameworks wait for M7 |
| 7 | Agentic RAG — decide first, then act | The agent routes each question before retrieving | decision loop diagram: guardrail check → route YES/NO → retrieve+ground or answer directly → answer | routing at temperature 0 is deterministic — whether, what, multi-hop, self-correct — before any embedding call |
| 8 | A 1.5B model can route reliably | Two classes, temperature 0 — the decision is simple enough for a laptop model | table/row pattern: 3 example queries each labelled YES/NO route | route deterministically at temp 0; generate the nuanced answer at higher temp, grounded in evidence |
| 9 | Real tools through an MCP gateway | ToolHive at the hub; each MCP server an isolated container on a spoke | hub-and-spoke: ToolHive circle at center, 5 tool-server boxes on spokes | per-request Cedar policy, per-server network isolation, no local creds — the agent points at one endpoint URL |
| 10 | Each tool server in its own sandbox | `thv run fetch` wraps a server in proxy + DNS containers | big-box anatomy inside a dashed isolation boundary: fetch server + ingress/egress/DNS boxes, arrow out to "public internet", crossed-out arrow to host | you never install a tool server on your laptop — IDE mode for dev, stack mode for headless compose runs |
| 11 | Guardrails — refuse before the model runs | A hard regex gate in application code, not a soft plea in the system prompt | fan-out: unsafe/safe query boxes → regex-guardrail box → refused/routed-to-model outcome boxes | a clever prompt can't bypass a gate that fires before any text reaches the model |
| 12 | Memory — a librarian who shelves by meaning | ChromaDB is Aria's long-term semantic memory, reused unchanged from M5 | pipeline: query box → embed arrow → shelved-chunks box (ChromaDB) → grounded-answer box | same HTTP API, same collection — scales from five chunks to millions of vectors unchanged |
| 13 | The whole agent ships in a container | Markdown + skills + MCP config bundled — portable, reproducible, one image | big-box anatomy: dashed agent-container boundary with 5 inner file/glue boxes, wired out to 3 native/service boxes | build the image once; the same agent runs identically on any laptop, CI, or headless compose stack |
| 14 | The agent IS Markdown + skills + tools (closing) | Hand off to the lab: read the three files, run the agent, wire in a tool | pipeline scene: 3 Markdown files → Aria box → 3 routed outcomes (retrieve, answer, refuse) | read the three files that are Aria, start ChromaDB + the agent, then wire in a live MCP tool; credit + lab hand-off |

<!-- Visual pattern vocabulary used above (reuse before inventing):
     fan-out (2 as numbered rows, 3, 5, 9 as hub-and-spoke, 11, 14) · two-panel comparison (6) ·
     big-box anatomy (4, 10, 13) · numbered rows (2) · pipeline (12, 14) · decision loop (7) ·
     table/rows (8) · hub-and-spoke (9) -->

## Recommended presentation order

Present strictly 1 → 14; each slide's vocabulary is used by the next. Open on the title scene (1) and
the five-idea preview (2) to set expectations. Slide 3 is the motivating problem — linger on it, because
"naive RAG can't decide" is the gap every later slide fills; make the wasted-embed-call-on-2+2 fact land
before moving on. Slides 4–6 are one continuous build-up on the declarative idea: slide 4 lands the
onboarding analogy, slide 5 turns that analogy into the concrete five-part anatomy, and slide 6
contrasts it against the hand-coded alternative — present these three back to back without a break, and
be explicit at slide 6 that the declarative-vs-framework choice is made *up front*, not by accident.
Slide 7 is the conceptual hinge of the whole module — the decide-first loop — slow down here; slide 8
immediately proves the hinge with a concrete example, so present 7 and 8 as a matched pair. Slides 9–10
are a matched pair on tool access (the gateway, then its isolation mechanics) — compress slide 10 under
time pressure if needed (it is mechanics, not a new concept) but never compress 7 or 9. Slide 11
(guardrails) and slide 12 (memory) are independent single-concept slides — present at normal pace, no
special lingering required. Slide 13 zooms out to the whole packaged agent; slide 14 hands off to the
lab — say the closing line and stop talking, let the lab do the proving.

## Fragment map

This deck carries no build-ups from the original 303 authoring — every slide (including the multi-box
slides: 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14) is presented as a single static, already-complete picture.
This matches the old deck's own construction (no `fragment` classes existed in the CDN-era HTML) and
suits the content: slide 6 is a comparison pair that reads better whole, slide 7 is a decision-loop
diagram meant to be read at a glance, and 4/5/9/10/13 are anatomy/hub-and-spoke layouts intended to be
read as one complete picture rather than revealed hop-by-hop. No fragments were added in the round-3
regen — a future revision could fragment slide 7 (question → guardrail → route → retrieve/answer) or
slide 9 (ToolHive hub → each spoke added one at a time) if a presenter wants a build, but the current
spec keeps parity with the approved baseline.

Static slides (all of 1–14): read in full on entry — no reveal-in-steps behavior in this deck.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Baseline = the OLD deck (14 slides); confirming no
orphans against both the lesson and the prior deck.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing / what you'll learn | 1, 2 | title scene (Aria assembled from Markdown + tools inside a container) + numbered-rows preview of all five learning objectives |
| §1 From a docs assistant to an agent — naive RAG always retrieves, no judgment about *when* | 3 | fan-out: an ops question and a trivia question both forced through the same embed→retrieve→generate pipe |
| §1 Aria, same model/vector-store/network pattern as M5, Acme runbooks reused | 3, 12 | carried as narration/labels rather than a separate slide — reuse-from-M5 is echoed again at slide 12 (ChromaDB memory) to avoid an orphan without adding a redundant slide |
| §2 The onboarding analogy — job description, operating procedures, skill guides, hand-coded robot vs declarative | 4, 6 | slide 4 = big-box anatomy of the three onboarding documents converging on "model = engineer"; slide 6 = two-panel comparison (hand-coded robot vs declarative agent) making the contract explicit |
| §3 The three files that define Aria — SOUL.md, AGENTS.md, SKILL.md, agent.py glue | 5 | fan-out: 5 stacked file/rule boxes → `agent.py` glue box → "Aria runs" |
| §4 Agentic RAG vs naive RAG — decide first (route YES/NO at temp 0), then retrieve if needed, then ground | 7 | decision-loop diagram: guardrail check → route → retrieve+ground or answer directly → answer |
| §4 The routing table proven on a 1.5B model at temp 0 | 8 | table/rows pattern with 3 example queries and their YES/NO route |
| §5 MCP tools via ToolHive — MCP as a standard tool interface, `web.fetch`, IDE vs Stack connection modes | 9 | hub-and-spoke: ToolHive circle at center, 5 tool-server spokes (web.fetch, GitHub, filesystem, HTTP, database) |
| §5 ToolHive per-server isolation — `thv run fetch`, ingress/egress/DNS containers, cannot touch host or other containers | 10 | big-box anatomy inside a dashed isolation boundary; explicit "cannot touch host filesystem or other containers" label |
| §6 Guardrails — hard regex gate in application code before the model is ever called | 11 | fan-out: unsafe/safe queries → regex-guardrail box → refused (LLM never called) / routed-to-model outcomes |
| §7 Memory — ChromaDB as long-term semantic memory, same collection reused from M5, scales unchanged | 12 | pipeline: query → embed → shelved chunks (ChromaDB) → grounded answer |
| §8 Declarative vs framework — when Markdown+skill is enough vs when you need an orchestration framework (M7 preview) | 6, 13 | slide 6's contract carries the "declarative is enough" side of the decision; slide 13's packaged-container view plus its takeaway is where the M7 forward-pointer (CrewAI, multi-agent) lives, avoiding a redundant slide while keeping the concept covered |
| Summary table — the whole agent ships as one container image | 13 | big-box anatomy: dashed container boundary with 5 inner file/glue boxes wired to native Ollama + ChromaDB + ToolHive |
| Closing hand-off — read the 3 files, start the agent, route 3 queries, wire in a live MCP tool | 14 | pipeline scene: 3 Markdown files → Aria → 3 routed outcomes (retrieve, answer, refuse) |

**No orphans.** All 14 old-deck slides and all lesson §1–§8 concepts (naive RAG's blind retrieval, the
onboarding-a-new-hire analogy, the three Markdown files + minimal glue, agentic RAG's decide-first loop,
the proven routing table, MCP tools via the ToolHive gateway and its per-server isolation, hard
application-layer guardrails, ChromaDB long-term memory reused from M5, and the declarative-vs-framework
decision that sets up M7) are covered above with an explicit slide mapping. Slide count, order, and
pagenos (`M6·01`–`M6·14`) are kept 1:1 with the approved old-deck baseline — no splits were required;
every old slide already carried exactly one idea and already had its own SVG scene, so the round-3
"text-only slide is a defect" rule did not trigger anywhere in this deck.
