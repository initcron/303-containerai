# Phase-3 Learner QA Report — Deep Dive Sims + Container X-Ray Pointer Prose

**Date:** 2026-07-23
**Target:** https://initcron.github.io/303-containerai/ (staging)
**Method:** Fresh clone of `schoolofdevops/303-containerai` (main, `ead5c4e`) for corpus/ground-truth
comparison; raw HTML fetch (curl) of the four staging pages + both sim HTML files; headless Chrome
(`--headless --disable-gpu --run-all-compositor-stages-before-draw --dump-dom`) to confirm each sim's
JS actually executes and seeds its event log. Public clone confirms `labs/tools/` does not exist and
`x-ray`/`xray` has zero hits anywhere under `site/docs/` in the repo — the pointer prose is staging-only,
pre-release content, as expected. `labs/tools/container-xray/README.md` could not be evaluated (absent
from the public clone); pointer prose was judged only on its own clarity, per the task's scope.

---

## Verdicts

1. **m3b deep-dive — LoRA Trade-off Playground sim: PASS.** Iframe present, self-contained, DOM-verified,
   intro prose clear, corpus/numbers internally consistent with the page's own captured lab output.
2. **m5 deep-dive — RAG Retrieval Playground sim: PASS.** Same checks pass; corpus text is a byte-for-byte
   (823-char) match against the real `labs/m5/docs/acme-runbooks.md` in the fresh clone.
3. **Render regression (both deep-dive pages): PASS.** No fence-render bug. Tables render as real
   `<table>` elements (1 on m3b, 2 on m5), no code block swallows a subsequent section, no unrendered
   `:::` or `{{` markdown/MDX artifacts leaked into output, section/heading counts are sane (m3b: 6
   numbered sections + Teardown; m5: 7 numbered sections + Teardown).
4. **Container X-Ray pointer prose (m1 lab + capstone): PASS as prose.** Both pointers clearly state what
   the tool is, where it lives, the exact run command, and read as optional/additive — no overpromising
   detected in the text itself. Actual delivery cannot be verified (README not in public clone yet).

---

## One-line findings

- **m3b sim:** iframe sits directly before §6 ("Experiment: comparing rank and learning-rate variants"),
  exactly where the intro line ("Feel the trade-offs here first, then prove them live below...") points;
  DOM confirms TRY-THIS (3-step "Try this" banner), rank/LR/iters dials, Reset button, `prefers-reduced-motion`
  CSS block, and an honest-model footnote disclosing interpolation/extrapolation from 3 real captured runs;
  headless dump shows the event log pre-seeded with `ready` + `iter 50 train 0.200 | val 0.148` (matches
  the deep-dive's own baseline table exactly) and the challenge text populated with real Step 1 text — JS
  init ran.
- **m5 sim:** iframe sits directly before §7 ("Experiment: re-ingesting the corpus...") — one section later
  than m3b's §6 only because m5 has an extra numbered section (§6, ChromaDB query) ahead of it; same
  intro-then-sim pattern, same TRY-THIS/dials/Reset/reduced-motion/footnote/event-log elements all present
  and JS-verified; corpus text (`CORPUS_TEXT` JS constant, 823 chars) diffed byte-identical against
  `labs/m5/docs/acme-runbooks.md` in the fresh clone — genuinely the real corpus, not a paraphrase.
- **Render regression:** clean on both pages — no giant code block swallowing prose/headings, no raw
  `:::` admonition markers or `{{...}}` leaking through, tables are real `<table>` markup.
- **Container X-Ray pointers:** m1 lab's version sits under "What you built — what's next" → "Try the
  Container X-Ray" (plain heading + para, not boxed); capstone's version is a `tip` admonition box in
  the same style as other callouts on the page. Both give the exact path (`labs/tools/container-xray/`),
  exact run command (`bash labs/tools/container-xray/serve.sh`), and describe distinct lenses per module
  (Wiring at M1, Stack/Platform at capstone) — consistent with the "one lens per module" design in
  `planning/specs/2026-07-22-depth-retrofit-design.md`. Framing is unambiguously optional in both places.

---

## Detailed observations (record, not fix)

### 1. m3b deep-dive — LoRA Trade-off Playground

| # | Page/Step | Expected | Got | Severity |
|---|---|---|---|---|
| 1.1 | m3b deep-dive, intro | Iframe before the "Experiment" section | Iframe at line 171, immediately before `<h2 id="6--experiment-comparing-rank-and-learning-rate-variants">` | OK — matches |
| 1.2 | m3b deep-dive, intro prose | Explains what to do before the sim | "Feel the trade-offs here first, then prove them live below. Drag rank, learning rate, and iterations and watch the loss curves respond — including what happens when you push iterations well past the real 50 the lab ran." — concrete, action-oriented | OK — clear |
| 1.3 | `/sims/m3b-lora-tradeoff.html` fetched directly | Zero external refs (self-contained) | `grep` for `src="http`, `href="http`, `@import`, `<link `, `<script src=`, `fetch(`, CDN/googleapis/jsdelivr/unpkg — all zero matches | OK — self-contained |
| 1.4 | DOM: TRY-THIS | 3-step challenge markup present | `<span class="tag">Try this</span>` + 3 numbered dots (`d1`/`d2`/`d3`); `chTxt` populated at runtime with real Step 1 text referencing the actual baseline number (0.200) | OK |
| 1.5 | DOM: dials | Rank, LR, iterations controls | `rankPills`, `lrPills` (button groups) + `itersRange` slider (1–200, default 50) | OK |
| 1.6 | DOM: Reset | Reset control present and wired | `#reset` button, click handler = `location.reload()`, tooltip states the exact reset state (rank 8, lr 1e-5, iters 50) | OK |
| 1.7 | CSS: reduced motion | `prefers-reduced-motion` handled | `@media (prefers-reduced-motion:reduce){...}` block present | OK |
| 1.8 | Honest-model footnote | Discloses sim is not a live trainer | `id="note"` tooltip: "Teaching model, not a live trainer. Curves are interpolated/extrapolated from THREE real single captured runs..." — names the exact anchors (rank8/lr1e-5, rank4/lr1e-5, rank8/lr1e-4) and states run-to-run variance is not modeled | OK — good disclosure |
| 1.9 | Headless Chrome JS-init check | Event log seeded on load | `evList` contains a `ready` event ("base Qwen2.5-0.5B-Instruct loaded · adapter rank 8, lr 1e-05, 8-example toy set") and an `iter 50` event ("train 0.200 \| val 0.148 (real captured baseline)") immediately in the dumped DOM | OK — JS ran |

No BLOCKER/CONFUSING/COSMETIC issues found on this touchpoint.

### 2. m5 deep-dive — RAG Retrieval Playground

| # | Page/Step | Expected | Got | Severity |
|---|---|---|---|---|
| 2.1 | m5 deep-dive, intro | Iframe before §6 (per task framing, mirroring m3b) | Iframe is before **§7** ("Experiment: re-ingesting the corpus under different chunking strategies"), immediately after §6 ("Querying ChromaDB directly"). m5 has 7 numbered sections vs. m3b's 6 — the sim consistently precedes the page's final "Experiment" section in both modules, just numbered one higher here. | COSMETIC — not a defect, just a numbering difference from the task's m3b-derived expectation; flagging so it isn't mistaken for a placement bug |
| 2.2 | m5 deep-dive, intro prose | Explains what to do before the sim | "Before running the real experiment below, feel the trade-off yourself. This playground re-chunks the exact Acme corpus live as you move the dials, retrieves against the real captured distances from this course's lab, and tracks the context-budget arithmetic from §4..." — clear and specific, references back to earlier sections by number | OK — clear |
| 2.3 | `/sims/m5-rag-retrieval.html` fetched directly | Zero external refs | Same grep sweep as 1.3 — zero matches | OK — self-contained |
| 2.4 | Corpus fidelity claim | Sim claims to use the real `labs/m5/docs/acme-runbooks.md` | JS comment: "Ground truth: labs/m5/docs/acme-runbooks.md, 823 chars, 4 runbook sections. Reproduced verbatim below." Extracted the `CORPUS_TEXT` JS string and diffed byte-for-byte against the fresh clone's `labs/m5/docs/acme-runbooks.md` — **identical**, 823 chars both sides | OK — verified true, not just claimed |
| 2.5 | DOM: TRY-THIS | 3-step challenge with real content | `Try this` tag + 3 log-event strings tied to real captured numbers: Step 1 flags the 150/0 chunking's heading-only orphan at dist 0.3700 ("Best score in the whole experiment, and it has no answer in it"); Step 2 flags a context-budget blowout (1200×top-5 → >300% of `num_ctx=4096`); Step 3 confirms the payments question's precise match | OK — steps teach real failure modes, not generic filler |
| 2.6 | DOM: dials, Reset, reduced-motion, footnote | Same bar as m3b | All present: chunk-size/overlap/question controls, `#reset` (resets to chunk 500/overlap 50/k=3/payments), `prefers-reduced-motion` CSS block, `id="note"` footnote disclosing interpolation between 3 real captured runs (500/50, 150/0, 1200/200) and stating "No live embedder, no live LLM call" | OK |
| 2.7 | Headless Chrome JS-init check | Event log seeded | `evList` shows `ready` ("ChromaDB + genai-app loaded · chunk_size=500, overlap=50, k=3 (lab baseline)") and `re-chunked` ("2 chunks (real captured baseline)") on load | OK — JS ran |

No BLOCKER issues. One COSMETIC note (2.1) on section numbering vs. the task's "before §6" framing —
worth a heads-up to whoever wrote the QA brief, since it was almost certainly written against m3b's
structure and doesn't map 1:1 onto m5's extra section.

### 3. Render regression (both pages)

| # | Page | Check | Result | Severity |
|---|---|---|---|---|
| 3.1 | m3b deep-dive | Table renders as `<table>` | 1 real `<table>` element (rank/LR comparison in §6) | OK |
| 3.2 | m5 deep-dive | Tables render as `<table>` | 2 real `<table>` elements | OK |
| 3.3 | m3b deep-dive | No section swallowed into a giant code block | Largest `<pre>` blocks are 5658/3452/3500 chars — all legitimate multi-line bash heredocs + captured training-run output, none contain markdown headings or subsequent-section text | OK |
| 3.4 | m5 deep-dive | No section swallowed into a giant code block | Largest `<pre>` blocks are 8281/8849 chars — a full Python script (`compare_chunking.py`) and its 3-variant × 4-question captured output; verified no heading/prose leakage inside | OK |
| 3.5 | Both | No unrendered MDX/markdown syntax | Zero occurrences of literal `:::` (admonition fence) or `{{` (template syntax) in either rendered page | OK — the fence-render bug this course shipped before does not appear to be present here |
| 3.6 | Both | Section count sane | m3b: 6 numbered `<h2>` sections + Teardown = 7 headings, matches ToC. m5: 7 numbered `<h2>` sections + Teardown = 8 headings, matches ToC | OK |

No render regression found.

### 4. Container X-Ray pointer prose (m1 lab + capstone)

| # | Page/Step | Expected | Got | Severity |
|---|---|---|---|---|
| 4.1 | m1 lab, "Try the Container X-Ray" (under "What you built — what's next") | Clear what the tool is | "a small local tool that polls your real docker state and native Ollama every few seconds — its Wiring lens shows running containers, Ollama's status and pulled models, and a live `host.docker.internal` reachability check." Concrete and scoped to what M1 taught. | OK |
| 4.2 | m1 lab | Clear where to find it | `labs/tools/container-xray/`, run command `bash labs/tools/container-xray/serve.sh`, pointer to `labs/tools/container-xray/README.md` for details | OK |
| 4.3 | m1 lab | Clear it's optional | Framed as a question — "Want to *watch* this wiring live instead of just running the one-shot command?" — reads as an invitation, not a requirement; sits after the module's "what you built" wrap-up, not blocking any step | OK |
| 4.4 | m1 lab | Foreshadows growth | "It grows a lens per later module (Stack at M5–M7, Platform at the capstone)" — sets expectation correctly without overpromising specifics | OK |
| 4.5 | capstone, "Try the Container X-Ray" (tip admonition after Step 0's `platform-check.sh`) | Clear what it adds over the existing tool | "`platform-check.sh` gives you a point-in-time pass/fail. For a live view as you bring the platform up..." — explicit contrast with the tool already on the page, avoids redundant re-explanation | OK |
| 4.6 | capstone | Clear where/how | Same run command pattern, describes Platform lens (image cache across M2–M8, disk usage, running overview) and Stack lens (compose services/volumes/networks) distinctly, pointer to README | OK |
| 4.7 | capstone | Clear it's optional | Boxed as a `tip`-style admonition (visually distinct from required steps), titled "Try the..." | OK |
| 4.8 | Both pages | Overpromise check | Neither page claims specific features not describable from the prose alone (no claims of auto-remediation, alerting, or being required for capstone completion) — descriptions are plausible, scoped, and match the "one lens per module" design noted in `planning/specs/2026-07-22-depth-retrofit-design.md` | OK — no overpromise detected in the prose itself |
| 4.9 | `labs/tools/container-xray/README.md` | N/A — cannot verify actual delivery | Directory does not exist in the public clone (`ead5c4e`); confirmed via `find`/`fd` — expected pre-release state per task instructions. A real learner following these links today would get a 404/missing-file, but this is understood to be a staging-timing gap, not a content defect in the pointer prose itself. | Flagged for tracking, not scored as a prose defect |

---

## Machine notes (not findings)

- The rtk hook intercepts and mangles piped/flagged shell commands (`fd`, `grep -o`, `curl` with pipes)
  when invoked through the standard Bash tool — commands silently got `-m`/other flags injected,
  producing `unexpected argument` errors. Workaround used throughout: wrap commands in `sh -c '...'`.
- Sitemap/canonical URLs on the `initcron.github.io` staging deployment resolve through `<loc>` tags that
  point at `schoolofdevops.github.io` (the production canonical domain) — this is expected staging
  behavior (same site config, different deploy target), not a broken link; content was still served
  correctly from `initcron.github.io` for every URL tested.
