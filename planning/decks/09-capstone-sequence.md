# Capstone — Ship the Acme AI Platform · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored retroactively per the round-3 ADDENDUM for
     ORIGINAL decks (wave 2). The old deck (`site/static/decks/09-capstone.html`,
     pre-coursesmith, CDN-loaded reveal.js 4.6.1) is the approved coverage baseline:
     every old slide's concept appears below at the same order/count, 1:1, no split. -->

This companion doc maps the 11-slide explainer deck (`site/static/decks/09-capstone.html`) to the
Capstone page (`site/docs/capstone/index.md`). The deck teaches **concepts**, not commands — it turns
the capstone's "eight modules snap into one platform" narrative into a hand-drawn whiteboard walk a
learner takes before opening the lab. Visual language follows the CourseSmith whiteboard style
contract (`whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary / `#757575` secondary
strokes on white paper, five semantic pastel fills (green good · red bad · blue data · orange caution ·
purple meta), the `#rough` wobble filter on shapes only, shared `#ah`/`#ahg` arrowhead markers. The arc:
**eight modules → one wired platform → six shipped moves (serve, run, package, secure, ship, prove
portable) → the arc of intelligence the course taught (naive RAG → agentic RAG → crew).**

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Ship the Acme AI Support Platform (title) | Frame the capstone: every module becomes one deployable product | Title scene: four module-group boxes fanning into one wheeled platform box | credit line: Gourav Shah · School of DevOps & AI · Capstone · Day 2 |
| 2 | What you'll assemble — the whole platform | See the three zones before touching a command: native host, containers, supply chain | Big-box anatomy: host boundary (Ollama) + containers boundary (3 apps + ChromaDB + ToolHive) + supply-chain lane (ModelKit, SBOM/sign, CI) | The container boundary is the rule: the model stays native, everything else is a container |
| 3 | How the modules connect | Each of the eight modules maps to exactly one capability of the shipped platform | Two-column list (M1–M4 left, M5–M8 right) converging into one "Acme AI Support Platform" box | Nothing was thrown away — the capstone is the sum of eight modules, wired together |
| 4 | Move 1 — Serve the model | The model has two interchangeable homes behind one stable API | Two-panel comparison (Ollama native / vLLM container) fanning into a shared `/v1` endpoint box, then into "every consumer" | Swap the engine behind the wall socket — no downstream container changes a single line |
| 5 | Move 2 — Run the Incident Crew | Four specialised agents run in sequence, sharing one model and two shared services | Pipeline (Triage → Investigate → Fix → Review) with ToolHive + ChromaDB feeding in from below | Specialisation with an approval gate — a traceable, auditable incident-response report |
| 6 | Move 3 — Package as a ModelKit | Weights, prompt, and config seal into one versioned, pushable artifact | Fan-out: three inputs → ModelKit box → Registry box | One command pulls exactly that version — no shared drives, no stray prompt files |
| 7 | Move 4 — Secure the image | Every image is inventoried, scanned, and signed before it ships; every tool call is sandboxed | Pipeline (SBOM → Scan → Sign → Verify) with a reject branch, plus a sandboxed-execution box below | An image that fails the scan never reaches the registry; a passing one is signed and attested |
| 8 | Move 5 — Ship via CI | A push to `main` is the only trigger a release needs | Pipeline (push → build → scan → sign) into a signed GHCR box, with a reject branch back down | A passing build produces a signed, attested image any host can pull and verify |
| 9 | Move 6 — The portability proof | Nothing above depends on which container runtime you run | Fan-out: three runtimes (Colima/Rancher/OrbStack) converging on one "same platform" box → "identical output" | The spec, not the vendor, defines the contract — steps 1–7 run unchanged on every runtime |
| 10 | The arc you shipped | The three modules (M5/M6/M7) are one progression, not three unrelated demos | Staircase/ladder: Naive RAG → Agentic RAG → Crew, "simple & predictable → capable & auditable" | You learned not just how each pattern works, but when it is the right one to reach for |
| 11 | You can now ship AI on any runtime (closing) | Send the learner into the lab with the whole arc in one image | Closing scene: sealed "Acme AI" platform box rolling toward "Any runtime" | Now open the Capstone lab. · Gourav Shah · School of DevOps & AI |

<!-- Visual pattern vocabulary used above (reuse before inventing):
     fan-out (slides 1, 6, 9) · two-panel comparison (slide 4) · big-box anatomy (slide 2) ·
     pipeline with hop-by-hop fragments (slides 5, 7, 8) · staircase/ladder (slide 10) ·
     two-column list → converge (slide 3) -->

## Recommended presentation order

Present strictly 1 → 11. Open on slide 1 to set the "everything snaps together" frame, then slide 2 is
the conceptual hinge — linger here, it is the map the rest of the deck walks. Slides 4–9 are one
continuous build ("the six moves you actually run") — keep momentum, each move is one lab step. Slide 5
is the busiest single diagram (four agents + two shared services): if short on time, name the four
stages fast and spend the saved seconds on slide 10, which is the course's real payoff — the naive →
agentic → crew progression is the idea learners should leave remembering. Never compress slide 2 (the
container-boundary rule) or slide 10 (the arc).

## Fragment map

This deck is a "tour of what you already built" — every slide's diagram is a completed, static picture
the presenter narrates whole, not a suspenseful reveal. No slide uses fragments.

Static slides (all of 1–11): every slide shows its full picture at once — this is a review/synthesis
deck (comparison, anatomy, and pipeline-as-summary read better whole than built up hop by hop).

## Coverage check (HARD GATE — §0)

Every section of the capstone page maps to a slide below. No orphans.

| Capstone page section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Capstone framing — 8 modules → 1 platform | 1, 3 | Title scene fans 4 module-groups into the platform box; slide 3 lists all 8 by number |
| §1 The Platform at a Glance (dispatch-centre analogy: native brain, containerized teams, sealed supply chain) | 2 | Big-box anatomy mirrors the lesson's own Mermaid diagram (Host / Containers / Supply chain) |
| The container boundary rule (model native, everything else containerized) | 2 | Carried as the slide's takeaway, echoed again in the closing scene (slide 11) |
| Step 1 — Serve the model (M2/M3, OpenAI-compatible `/v1`, wall-socket abstraction) | 4 | "Wall socket" analogy realized as the shared `/v1` box between the two engines and every consumer |
| Step 2 — Start the platform / Step 3 — Support Agent / Step 4 — Incident Crew (M5/M6/M7) | 5 | One pipeline slide covers the crew's four-stage run; Docs Assistant + Support Agent's shared ChromaDB shown as the "shared knowledge" box |
| Step 5 — Package the model (M4, ModelKit) | 6 | Fan-out of the three sealed inputs (weights, prompt, quant config) into one OCI artifact |
| Step 6 — Secure the crew image (M8, SBOM/scan/sign) + ToolHive sandboxing (M6/M7) | 7 | Pipeline with an explicit reject branch; sandboxed tool execution called out as its own box |
| Step 7 — Ship via CI (M8, GitHub Actions pipeline) | 8 | Push-to-build-to-scan-to-sign pipeline into signed GHCR, reject branch shown |
| §3 Portability Proof (OCI, Compose Spec, `host.docker.internal`, ModelKit, Cosign referrers all runtime-agnostic) | 9 | Three named runtimes fan into one "same platform" box; "identical output" is the payoff label |
| §4 The arc of intelligence (Naive RAG → Agentic RAG → Crew) | 10 | Staircase idiom carries the course's central progression claim |
| §4 What You Built (the ladder table, M1–M8) | 3 | Same slide as the module-map; each module's contribution is a labeled row |
| §4 Take-home (second use case) / Extension (LoRA/QLoRA, M3B) | 11 | Closing scene's "ships on any runtime" claim generalizes to the take-home framing; kept off-slide as narration since it is a forward-pointer, not new deck vocabulary |
| Course sign-off — "you can now ship AI on any runtime" | 11 | Closing title + scene + credit hand-off |

**No orphans.** Every capstone-page section above has a slide; every slide above has a page anchor.
The Take-home/Extension material (§4 tail) is intentionally carried as presenter narration off slide 11
rather than a 12th slide — it is a forward pointer to material outside this module's own concepts, not
an uncovered capstone concept, and the old deck (11 slides, closing on the "ship on any runtime" claim)
already treats it this way; no slide is added or dropped, preserving the old deck's 1:1 slide count.
