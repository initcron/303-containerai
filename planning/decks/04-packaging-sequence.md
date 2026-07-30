# Module 4 — Packaging Models as OCI Artifacts · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate. -->

<!-- 2026-07-26 round-3 skeleton regen (ADDENDUM for original decks, .superpowers/sdd/deck-regen-contract.md):
     this deck was authored pre-coursesmith (04-packaging.html loaded reveal.js 4.6.1 + Patrick Hand
     from CDNs) and had NO sequence spec — this file is the first one, authored from the shipped
     deck as the approved coverage baseline. All 12 old slides carried real hand-drawn SVGs already
     (no text-only defects to fix), so every SVG scene ports verbatim onto the new skeleton with no
     viewBox changes. Content parity: same 12 slides, same order, same pagenos (M4·01–12), same
     facts/numbers. The only structural changes: (1) every `p.takeaway` (10 of them, slides 2–11;
     slides 1 and 12 never had one) was REMOVED from the rendered HTML — none deleted as content,
     all relocated into this spec's Takeaway column below; (2) the four old subtitles that exceeded
     80 chars (slides 3, 5, 9, 12) were cut to one line ≤80 chars — the relocated clauses were
     already present as in-SVG labels/gray captions on those slides (or, for slide 12, folded into
     the credit line's lab hand-off), so no fact was lost; (3) zero external refs — reveal.js 5.2
     runtime + Patrick Hand woff2 are now inlined via the skeleton, killing the old
     cdnjs/fonts.googleapis.com loads. -->

This companion doc maps the 12-slide explainer deck (`site/static/decks/04-packaging.html`) to the
Module 4 lesson (`site/docs/m4-packaging/lesson.md`). The deck teaches **concepts**, not commands —
it turns the lesson's shipping-manifest and book-warehouse analogies into hand-drawn whiteboard
visuals a learner walks through before opening the lab. The visual language follows the CourseSmith
whiteboard style contract (`templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive,
`#1e1e1e` primary / `#757575` secondary strokes on white paper with the five semantic pastel fills
(§1: green good · red bad/full · blue data · orange caution · purple meta — this deck uses the
neutral ink/gray palette throughout, no pastel fills in the original slides), the `#rough` wobble
filter on shapes only, and the shared `#ah`/`#ahg` arrowhead markers. The arc moves — **the chaos of
loose model files (Slack links, README hints, drifting versions) → the sealed labelled-crate fix
(ModelKit) → why OCI is the right storage mechanism underneath (layered blob store) → the CNCF stack
that implements it (KitOps + kit CLI + ORAS) → the Kitfile manifest that drives it → the full
pack→push→pull→run lifecycle → the selective-pull payoff → multi-registry portability → how it
compares to `docker model package` → hand-off to the lab.**

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Packaging Models as OCI Artifacts (title) | Module framing: a model ships the way a container image ships — versioned, layered, sealed into one artifact | Title sketch: a labelled crate (Kitfile manifest tag on top) holding four inner sections — weights, adapter, config, prompts | credit line: Gourav Shah · School of DevOps & AI · KitOps · ModelKit · ORAS |
| 2 | What you'll learn | Set the four learning objectives: why OCI fits models, packing a Kitfile/ModelKit, multi-registry push/pull, selective pull + KitOps-vs-docker contrast | numbered rows (circles 1–4) | By the end you'll treat a model the way you treat an image: tagged, stored, and shipped |
| 3 | The problem with loose model files | The motivating problem: weights on a shared drive, prompt in Slack, config in a README note — every receiver re-assembles by hand and versions drift | fan-out: three scattered dashed source boxes feeding a confused "Receiver" box that re-assembles manually, arrow out to consequences | Logistics teams solved this decades ago with a shipping manifest and a sealed, labelled crate |
| 4 | A ModelKit is a sealed, labelled crate | The core fix: one signed bundle — open it and the contents are exactly what the manifest says | big-box anatomy: outer crate + Kitfile manifest tag on top + four inner sections (model, code, config, prompts) | Model weights + adapter + config + prompts, versioned together — the manifest names every item |
| 5 | An OCI artifact is a layered blob store | Why models fit OCI: the same mechanism that stores container image layers stores any typed byte stream, including model checkpoints | two-panel comparison: container image layer stack vs ModelKit layer stack, "same spec" arrow between them | A layer is just bytes + a digest — registries dedupe, so retraining only the prompt pushes just the config layer |
| 6 | KitOps, ModelKit & ORAS | Name the CNCF stack: the `kit` CLI on top, ORAS underneath, the OCI distribution API at the base that every registry speaks | big-box anatomy: three stacked layer boxes (kit CLI → ORAS → OCI distribution API) fanning out to registry names | Because it's plain OCI underneath, the same commands work on every compliant registry |
| 7 | The Kitfile — your shipping manifest | Show the manifest mechanics: a tiny YAML file whose fields each map to one typed OCI layer | two-panel: Kitfile YAML fields on the left, arrows mapping each field to a typed OCI layer box on the right | `kit pack` reads the Kitfile, hashes each file into a layer, and stores it in the local kit cache |
| 8 | The lifecycle: pack → push → pull → run | Walk the full path from a workspace to a serving node, with the registry as the hub in the middle, and clarify OCI ships the crate but doesn't run it | pipeline: workspace → (push) → registry hub (drum) → (pull) → serving node → runtime, left to right | OCI is the distribution mechanism here, not the execution mechanism — the crate ships; a separate runtime opens it |
| 9 | Selective pull — grab only what you need | The KitOps payoff: typed layers let a consumer pull just the layer it needs instead of the whole bundle | fan-out: one ModelKit's three layers (model/code/datasets) filtered out to three different consumers (serving node, CI pipeline, notebook) | The typed-layer manifest is the catalogue — each consumer pulls its box, not the whole book |
| 10 | One artifact, every registry | Multi-registry portability: the same `kit push`/`unpack` syntax targets any OCI-compliant registry, only the reference changes | hub-and-spoke: one ModelKit in the centre radiating out to six registries (GHCR, Docker Hub, Quay, Harbor, Artifactory, local registry:2) | TLS by default; add `--plain-http` for local or air-gapped HTTP-only registries |
| 11 | ModelKit / ORAS vs docker model package | Compare the two OCI-model-packing paths side by side: CNCF portability vs Docker-Desktop-tied scope | two-panel comparison table: KitOps ModelKit vs docker model package across five rows | Want portability across registries and runtimes — including Flux into Kubernetes or air-gapped Harbor? Take the CNCF path |
| 12 | Ship your model like an image (closing) | Hand off to the lab: pack SmolLM2 + prompts, push to a registry, pull on a clean dir, then selective-pull the weights | pipeline: sealed ModelKit crate → registry (drum) → serving node | credit + lab hand-off: Next — Lab: Pack & Push a ModelKit with KitOps · Gourav Shah · School of DevOps & AI |

<!-- Visual pattern vocabulary used: title scene (1) · numbered rows (2) · fan-out (3, 9) ·
     big-box anatomy (4, 6) · two-panel comparison (5, 7, 11) · pipeline (8, 12) ·
     hub-and-spoke (10). -->

## Recommended presentation order

Present strictly 1 → 12; each slide's vocabulary is used by the next. Open on slide 1 to set the
crate framing, then move briskly through 2 (the roadmap) into the motivating problem on slide 3 —
the scattered-files picture is intuitive, don't over-explain it. **Slide 4 is the conceptual hinge**:
once the learner sees the ModelKit as a labelled crate with four named compartments, slides 5–7
are just filling in *how* that crate is actually built (OCI mechanism → CNCF stack → Kitfile
manifest) — keep momentum across that three-slide run and land slide 4's takeaway crisply before
moving on. Slide 8 (the full lifecycle) is the second hinge — pause on the closing line that OCI
ships the crate but a separate runtime opens it; this is the single most commonly confused point in
the module. Slides 9–10 are the fast payoff pair (selective pull, then multi-registry) — present
them briskly back to back, they reinforce the same "typed layers, one syntax" idea from two angles.
Slide 11 is a quick comparison beat before hand-off. Under time pressure, compress 9–11 to a single
pass each — never compress 4 or 8.

## Fragment map

This deck has no hop-by-hop build-ups in the original — every slide is a static anatomy, comparison,
fan-out, pipeline, or hub-and-spoke diagram that reads better whole. No fragments are used.

Static slides (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12) show the full picture at once.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. No orphans.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| §1 — the problem with loose model files: scattered weights/prompts/config, version drift | 3 | Fan-out: three dashed scattered sources feeding a confused Receiver box |
| §1 — the shipping-manifest + labelled-crate analogy; ModelKit as the sealed container for ML | 1, 4 | Title scene sets the crate framing; slide 4 is the anatomy detail |
| §2 — an OCI artifact is a layered blob store with a manifest; why models fit | 5 | Two-panel: container image layers vs ModelKit layers, "same spec" |
| §2 — layer dedup across versions (retrain prompt → only config layer pushed) | 5 | Folded into slide 5's takeaway |
| §3 — KitOps defines ModelKit + `kit` CLI; typed layers (model/code/datasets/docs) | 4, 6 | Slide 4 shows the typed compartments; slide 6 names the CNCF stack |
| §3 — ORAS underneath, same OCI distribution API every registry speaks | 6 | Big-box anatomy: kit CLI → ORAS → OCI distribution API |
| §3 — KitOps vs `docker model package` ecosystem-scope contrast | 11 | Two-panel comparison table, five rows |
| §4 — the Kitfile: YAML manifest, fields map to typed OCI layers | 7 | Two-panel: YAML fields → arrows → typed layer boxes |
| §5 — full flow: Kitfile → kit pack → registry → destination nodes | 8 | Pipeline: workspace → push → registry hub → pull → serving node → runtime |
| §6 — selective pull: `--filter=model/code/datasets`, the book-warehouse-by-chapter analogy | 9 | Fan-out: one ModelKit's layers filtered to three different consumers |
| §7 — multi-registry portability: same `kit push`/`unpack` syntax, `--plain-http` for local/air-gapped | 10 | Hub-and-spoke: one ModelKit radiating to six registries |
| §8 — ModelKit vs a plain container image: no selective pull, no semantic layer types, images are meant to run | 11 | Folded into the KitOps-vs-docker comparison table (docker model package is Docker's version of "plain image with a GGUF") |
| §8 — OCI is a distribution mechanism, not an execution mechanism; a runtime unpacks and loads it | 8 | Pipeline slide's closing caption + takeaway |
| Module roadmap ("what you'll learn") | 2 | Numbered rows, four objectives |
| Lab hand-off — pack SmolLM2 + prompts, push, pull on clean dir, selective-pull weights | 12 | Pipeline: crate → registry → serving node |

**No orphans.** Every lesson section (§1–§8) plus the roadmap intro and the closing lab hand-off has
at least one slide anchor. The Summary table at the end of the lesson is a recap of concepts already
covered by slides 1–11 and is not a separate slide anchor.
