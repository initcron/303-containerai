# Module 8 — Securing & Governing AI Workloads · Explainer Deck Sequence

<!-- CourseSmith sequence spec — authored and approved BEFORE the deck HTML is built.
     Convention: whiteboard-style-guide.md §5. One row per slide; every slide needs
     purpose + visual + takeaway. NO slide-count cap (§0): one idea per slide, every
     lesson concept gets a slide — the coverage table below is a hard gate.

     Round-3 regen note: this is an ORIGINAL deck (pre-coursesmith, no prior spec).
     The old deck (`site/static/decks/08-security.html`, CDN-loaded reveal.js 4.6.1 +
     Google Fonts, on-slide `p.takeaway` lines) is the approved coverage baseline for
     this spec — every old slide's concept appears below, 13 slides kept 1:1, same
     order, same pagenos. Every old slide already carried its own SVG scene, so no
     slide triggers the round-3 "text-only slide is a defect" rule. -->

This companion doc maps the 13-slide explainer deck (`site/static/decks/08-security.html`) to the
Module 8 lesson (`site/docs/m8-security/lesson.md`). The deck teaches **concepts**, not commands — it
turns each of the lesson's analogies into a hand-drawn whiteboard visual a learner walks through before
opening the lab. The visual language follows the CourseSmith whiteboard style contract
(`coursesmith/templates/deck/whiteboard-style-guide.md`): Patrick Hand cursive, `#1e1e1e` primary /
`#757575` secondary strokes on white paper with the five semantic pastel fills (§1: green good · red
bad/full · blue data · orange caution · purple meta), the `#rough` wobble filter on shapes only, and the
shared `#ah`/`#ahg` arrowhead markers. The arc moves from exposure to evidence — an agent is a security
surface with four unguarded exposures → the food-factory analogy (label, inspection, seal) → the
supply-chain pipeline that turns those three ideas into an enforced gate → the two-scanners-disagree
reality and the triage heuristic → Cosign's tamper-evident seal and its verify-on-deploy check →
sandboxing untrusted/generated code down to zero blast radius → hardening the agent image itself →
guardrails and human review at the model boundary → lightweight CI evals that prove the guardrails still
work → governance as four documented, enforced answers rather than a vendor product → hand-off to the
lab.

## Slide table

| # | Slide | Purpose | Visual | Takeaway |
|---|-------|---------|--------|----------|
| 1 | Securing & Governing AI Workloads (title) | Module framing: harden and ship the crew, the open-source way | title scene: a sealed shipping container carrying the agent, with a tamper-evident seal badge and a caption row (signed · scanned · sandboxed · governed) | credit line: Gourav Shah · School of DevOps & AI |
| 2 | What you'll learn | Preview the six controls this module locks in before the lab | numbered rows (circles 1–6) | by the end, the M7 crew ships through a pipeline that gates on security before it signs |
| 3 | An agent is a security surface | The motivating problem: tools, generated code, credentials, and network are all untrusted by default | fan-out: "Agent / M7 crew" box at center, four unguarded exposures fanning out (runs MCP tools, executes code, reads secrets, calls the network) | every exposure is untrusted by default — one compromised tool call becomes host access if left unguarded |
| 4 | Three things every shipped product needs | The analogy: ship an AI image like a food manufacturer ships a ready-meal | two-panel-style triptych: ingredients label / health inspection / tamper seal, each glossed to SBOM / vuln scan / signature | together they make the image trustworthy, auditable, and verifiable at every hop — laptop to registry to host |
| 5 | The supply-chain pipeline (centerpiece) | Turn the three analogy ideas into one enforced pipeline every image passes through | pipeline with a gate diamond: Source → Build → SBOM → Scan → Gate, clean branch to Sign → Registry → Verify, blocked branch to fix & rebuild | the scan must run before the sign, and the sign must not run if the scan fails |
| 6 | Two scanners disagree — that's the feature | Trivy and Grype catch different CVEs from the same image; triage, don't average | fan-out/converge: one "Agent image" box scanned by two boxes (Trivy, Grype) with different counts, converging into a "Triage: fixable + severity" box | fixable Critical/High → rebuild on a patched base; no fix → mitigate & log; Medium → track, don't block CI |
| 7 | Cosign: the tamper-evident seal | Signing closes the loop: sign in CI, verify before anything runs | pipeline: Cosign sign → Registry (image + signature) → Verify on deploy, with a dashed policy-gate branch down to "valid seal → run · else refuse" | a policy engine (Kyverno, OPA, or a pre-deploy script) refuses any image without a valid signature |
| 8 | Sandbox: a box with no blast radius | Untrusted/generated code runs in an ephemeral, locked-down container, then is discarded | big-box anatomy: dashed "Host" boundary containing a solid "Sandbox" box with barred exits labelled `--network none`, `--read-only`, `--cap-drop ALL`, `--pids-limit` etc. | deeper isolation: gVisor intercepts syscalls in user space; ToolHive runs each MCP tool in its own box |
| 9 | Hardening the agent image | The sandbox protects untrusted code; the agent image itself still needs a small attack surface | numbered rows (six checked rows): least privilege, read-only rootfs, drop capabilities, no privilege escalation, resource caps, secrets out + health checks | these controls are additive — even an exploited dependency finds almost nothing to work with |
| 10 | Guardrails at the model boundary | Supply chain protects the infra; guardrails protect what goes in and comes out | pipeline: Input screen → Model/agent → Output screen → Human approves, each stage glossed with what it catches (injection, PII/off-brand/bad URLs, destructive commands) | reuse M6's guardrail: a cheap classification call in front, and a reviewer that blocks destructive actions |
| 11 | Lightweight eval — smoke test for behavior | A handful of labeled cases, run in CI on every push, catches regressions before production | three-panel dimensions (Safety / Quality / Scope) each with a passing check-mark badge, captioned with the CI/tracing wiring | you don't ship what you can't measure — evals plus tracing tell you the guardrails still work |
| 12 | Governance without a vendor | Governance is four documented, enforced answers, written in YAML, enforced by open tools | fan-in: four question rows (reach, credentials, tools, approval) feeding a "Policy gate" box with permit/deny outcomes | the SBOM → scan → sign pipeline is the evidence trail that makes "who approved it?" auditable |
| 13 | Trust is a pipeline, not a promise (closing) | Hand off to the lab: run the tools, prove isolation, wire a guardrail + eval, read the CI pipeline | pipeline scene: Build → Scan → Sign → Serve, ending in a checked seal badge, captioned with the GitHub Actions gate | in the lab: run Syft/Trivy/Grype/Cosign, prove sandbox isolation, wire a guardrail + eval; credit + lab hand-off |

<!-- Visual pattern vocabulary used above (reuse before inventing):
     fan-out (2 as numbered rows, 3, 6, 10, 12) · two-panel/triptych comparison (4) ·
     big-box anatomy (8) · numbered rows (2, 9) · pipeline (5, 7, 10, 13) ·
     three-panel dimensions (11) · fan-in to a gate (12) -->

## Recommended presentation order

Present strictly 1 → 13; each slide's vocabulary carries into the next. Open on the title scene (1) and
the six-control preview (2) to set expectations for the whole module. Slide 3 is the motivating
problem — linger on it, because "every exposure is untrusted by default" is the gap every later slide
closes; make sure the four exposures (tools, code, secrets, network) land before moving on. Slides 4–5
are a matched build: slide 4 lands the food-factory analogy (label, inspection, seal) and slide 5
immediately turns it into the concrete enforced pipeline with the gate diamond — present these back to
back, and be explicit at slide 5 that the scan-before-sign ordering is the entire point, not an
implementation detail. Slide 6 (two scanners) and slide 7 (signing) are independent single-concept
slides on the scan and sign stages respectively — normal pace, no special lingering required. Slide 8
(sandboxing) is a second hinge slide — slow down on the barred-exits list, since it is the concrete proof
learners will reproduce in the lab. Slide 9 (hardening) is a compressible checklist under time pressure —
it restates the sandbox's controls applied to the agent image itself, so a fast read is fine if slide 8
already landed. Slides 10–12 (guardrails, evals, governance) form the module's second half — model
boundary, then proof, then policy — present at normal pace as three independent single-concept slides.
Slide 13 hands off to the lab; say the closing line and stop talking, let the lab do the proving.

## Fragment map

This deck carries no build-ups from the original 303 authoring — every slide (including the multi-box
slides: 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13) is presented as a single static, already-complete picture.
This matches the old deck's own construction (no `fragment` classes existed in the CDN-era HTML) and
suits the content: slide 5 is a pipeline diagram meant to be read at a glance with both the clean and
blocked branches visible at once, slide 6 is a converge-then-triage picture that reads better whole, and
8/9/12 are anatomy/checklist/fan-in layouts intended to be read as one complete picture rather than
revealed hop-by-hop. No fragments were added in the round-3 regen — a future revision could fragment
slide 5 (Source → Build → SBOM → Scan → Gate, then the clean/blocked branches) or slide 10 (Input →
Model → Output → Human, one stage at a time) if a presenter wants a build, but the current spec keeps
parity with the approved baseline.

Static slides (all of 1–13): read in full on entry — no reveal-in-steps behavior in this deck.

## Coverage check (HARD GATE — §0)

Every lesson section/concept maps to a slide. Baseline = the OLD deck (13 slides); confirming no orphans
against both the lesson and the prior deck.

| Lesson section / concept | Slide(s) | Notes (analogy used, echoes/forward pointers) |
|---|---|---|
| Module framing / what you'll learn | 1, 2 | title scene (sealed container, signed·scanned·sandboxed·governed caption) + numbered-rows preview of all six learning outcomes |
| Motivating problem — an agent runs tools, may execute generated code, reads credentials, reaches the network, all untrusted by default | 3 | fan-out: Agent/M7-crew box at center, four unguarded exposures fanning out |
| §1 The analogy: ingredients label, health inspection, tamper seal → SBOM, vulnerability scan, image signature | 4 | triptych: three labelled boxes (ingredients label / health inspection / tamper seal) glossed to Syft / Grype·Trivy / Cosign |
| §2 The supply-chain pipeline — Source → Build → SBOM → Scan → Gate → Sign → Registry → Verify; scan before sign, sign refused if scan fails | 5 | pipeline with gate diamond; clean branch down to Sign/Registry/Verify, blocked branch to fix & rebuild |
| §3 The SBOM — Syft catalogs every package into SPDX-JSON; input to scanners and the audit artifact | 4, 5 | carried as the "ingredients label" panel on slide 4 and the SBOM stage box on slide 5 — no dedicated slide needed, avoids an orphan without a redundant slide |
| §4 Vulnerability scanning — two scanners disagree, that's a feature; triage by fixable + severity | 6 | fan-out/converge: Trivy vs Grype producing different counts, converging into a "Triage: fixable + severity" box |
| §5 Signing — Cosign, key-based vs keyless OIDC, verify on deploy, policy engine refuses unsigned images | 7 | pipeline: Cosign sign → Registry (image + signature) → Verify on deploy, dashed policy-gate branch |
| §6 Sandboxing agent, tool, and generated code — ephemeral locked-down container, gVisor, ToolHive per-tool isolation | 8 | big-box anatomy: dashed Host boundary, solid Sandbox box with barred exits (`--network none`, `--read-only`, `--cap-drop ALL`, `--pids-limit`) |
| §7 Hardening the container image — non-root, read-only rootfs, drop caps, no-new-privileges, resource caps, secrets out, health checks | 9 | numbered rows (six checked controls) |
| §8 Guardrails — input screen (injection/out-of-scope), output screen (PII/off-brand/bad URLs), human-in-the-loop on destructive actions | 10 | pipeline: Input screen → Model/agent → Output screen → Human approves |
| §8 Evaluation — lightweight eval, three cases per dimension (safety, quality, scope), run in CI, tracing | 11 | three-panel dimensions (Safety / Quality / Scope), each with a PASS badge, captioned with the CI/tracing wiring |
| §9 Governance without a vendor — four documented, enforced answers (reach, credentials, tools, approval), enforced via OPA/Kyverno/ToolHive | 12 | fan-in: four question rows feeding a Policy-gate box with permit/deny outcomes |
| Summary table — all ten concepts restated | 1–12 (collectively) | the summary table has no dedicated slide; every row it lists already has a slide above, so nothing is orphaned |
| Closing hand-off — run Syft/Trivy/Grype/Cosign, prove sandbox isolation, wire a guardrail + eval, read the CI pipeline | 13 | pipeline scene: Build → Scan → Sign → Serve, ending in a checked seal; credit + lab hand-off |

**No orphans.** All 13 old-deck slides and all lesson §1–§9 concepts (the agent-as-security-surface
motivating problem, the food-factory analogy, the SBOM/scan/sign supply-chain pipeline with its
scan-before-sign gate, the two-scanners-disagree triage heuristic, Cosign signing and deploy-time
verification, sandboxing with gVisor/ToolHive as deeper-isolation forward pointers, agent-image
hardening, input/output guardrails with human-in-the-loop, lightweight CI evaluation, and
vendor-free governance as four enforced answers) are covered above with an explicit slide mapping.
Slide count, order, and pagenos (`M8·01`–`M8·13`) are kept 1:1 with the approved old-deck baseline — no
splits were required; every old slide already carried exactly one idea and already had its own SVG
scene, so the round-3 "text-only slide is a defect" rule did not trigger anywhere in this deck.
