# M3B Full Learner QA — including Deep Dive (Part 2)

**Date:** 2026-07-22
**Learner posture:** first-time learner, fresh off Module 3, Apple Silicon Mac (16 GB), Rancher
Desktop running, native Ollama on :11434, no course containers running at start.
**Machine state note:** returning-learner artifacts pre-existed (`~/mlx-lora-env` venv with
mlx-lm 0.31.3, HF cache with `Qwen/Qwen2.5-0.5B-Instruct` already pulled). This let idempotence
be tested honestly (install/download steps re-run against already-satisfied state).
**Scope:** published pages only, sidebar order — lesson → lab (Track A executed; Track B read
only, NVIDIA) → quiz → Deep Dive (Part 2). Deep Dive's experiment executed end-to-end. Nothing in
`planning/` or repo git history was consulted to judge the pages — only rendered HTML at
`https://initcron.github.io/303-containerai/docs/m3b-finetuning/*`.

---

## Verdict per page

| Page | Verdict | Notes |
|---|---|---|
| Lesson | **PASS** | Analogy-first (LoRA = sticky notes on a textbook), accurate technical content, links to a slide deck. Missing a real Mermaid diagram (see Finding 1). |
| Lab (Track A) | **PASS** | Every command ran verbatim, in order, and matched Expected output almost exactly (deterministic run on this exact mlx-lm version). Track B correctly left read-only/NVIDIA-gated and is honest about being unvalidated. |
| Quiz | **PASS** | 5 questions, exact `<Quiz>` schema, content maps directly onto lesson + lab material, no trivia. |
| Deep Dive (Part 2) | **PASS** | Genuinely advanced (rank/alpha math, NF4 internals, memorization signature, chat-template silent-failure mode), embeds a self-contained deck, and its 3-variant experiment reproduced the page's own Expected output almost to the decimal. |

---

## Numbered findings

1. **COSMETIC — Lesson has no Mermaid diagram despite spatial content.** The course's own
   authoring convention (CLAUDE.md) requires "at least one diagram where the topic is
   spatial/flow/architecture." The lesson has two clearly spatial concepts — the toolchain
   pipeline (`axolotl.yaml → docker run winglian/axolotl → trained adapter`) and the
   reproducibility pipeline (`training run → git tag + docker image tag → push to GHCR →
   adapter artifact`) — rendered as plain-text arrow strings inside a `<pre>` block, not as
   Mermaid. Verified via raw HTML: zero `mermaid` string occurrences in `m3b-finetuning/lesson`.
   The Deep Dive page has the same gap (zero mermaid hits) despite equally spatial material
   (rank/alpha notepad-width concept, storage-vs-compute-dtype flow) — but the Deep Dive's
   embedded slide deck visualizes these instead (see Finding 5), which substantially offsets it.

2. **COSMETIC — Lesson's own embedded slide deck is NOT self-contained** (contradicts the
   pattern the Deep Dive's deck follows correctly). `decks/03b-finetuning.html` makes 4 external
   fetches: cloudflare CDN reveal.js core JS/CSS, reveal.js white theme CSS, and a Google Fonts
   stylesheet (`fonts.googleapis.com/css2?family=Patrick+Hand`). On a fully offline machine or a
   restrictive corporate network, this deck would fail to render or lose theming. By contrast the
   Deep Dive's deck (`decks/03b-deepdive.html`) is fully self-contained: 0 external refs, ~1028
   inline `reveal` references (bundled runtime), verified by direct fetch and regex scan.

3. **COSMETIC — `cp -n` reports exit code 1 on macOS (BSD cp) when the destination already
   exists**, even though the copy is correctly and safely skipped. Hit in the Deep Dive's seed
   block: `cp -n train.jsonl valid.jsonl` on a machine where `valid.jsonl` already existed from
   the prior lab run.
   - Page: Deep Dive, "Where this picks up" seed block.
   - Command: `cp -n train.jsonl valid.jsonl`
   - Expected (implied): idempotent, silent success.
   - Got: file contents correctly unchanged (verified via matching md5 across two runs), but
     shell exit code was 1, not 0. GNU `cp -n` (Linux) exits 0 in the same situation — this is
     BSD-cp-specific behavior.
   - Impact: harmless as a bare command on its own line (as written on the page), but would break
     a learner's script if they wrapped the block in `set -e` or chained it with `&&`. The page's
     idempotence claim ("the seed step below is idempotent, so re-running it is safe") is true for
     *file state* but not for *exit code* on macOS. Worth a one-line caveat.

4. **Not a page defect — Bash-tool session boundary caused a false `deactivate` failure.**
   Running bare `deactivate` in a fresh shell (venv not active in that shell) triggered
   `pyenv-virtualenv: deactivate must be sourced. Run 'source deactivate' instead of 'deactivate'`
   (exit 1) because pyenv-virtualenv's shim intercepted the unbound word. Confirmed this is an
   artifact of the QA harness's fresh-shell-per-call behavior, not a page bug: running
   `source ~/mlx-lora-env/bin/activate` then `deactivate` in the *same* shell session (as a real
   learner's terminal would do) worked cleanly, exit 0. Recorded here only because the page
   doesn't warn that `pyenv`/`pyenv-virtualenv` users may see this shim collision if their shell
   init defines a competing `deactivate`.

5. **Positive finding — Deep Dive's embedded slide deck is excellent and fully verified.**
   Fetched directly (`decks/03b-deepdive.html`, 238 KB, self-contained). 19 `<section>` slides,
   content cross-checked line-by-line against all 6 numbered sections of the Deep Dive page:
   rank/alpha as notepad width (slides 1-4), dropout (slide 5), NF4 bucket placement (slides 6-7),
   double quantization (slide 7), storage-vs-compute dtype (slide 8), learning rate / loss-curve
   reading / memorization signature (slides 9-11), gradient accumulation (slide 12), chat-template
   silent mismatch (slide 13), fine-tune-vs-RAG-vs-prompt fork (slide 14), and the 3-variant
   experiment with its comparison numbers reproduced verbatim on slides 15-17. Takeaways slide
   (19) matches the page's closing "Where you will use this" bullets one-for-one. No drift between
   deck and page.

6. **Positive finding — the lab → Deep Dive seam works from the lab's end-state, confirmed
   idempotent by design (with caveat in Finding 3).** Ran the Deep Dive's seed block twice: once
   immediately after completing lab Track A (train.jsonl/valid.jsonl present, venv active), once
   again as a second, redundant run. Both times the file content was correctly preserved (md5
   identical), `mkdir -p` and `[ -f train.jsonl ] || cat > ...` behaved exactly as documented. The
   claim "This works whether the lab's teardown already ran or not" was only tested from the
   lab's end-state (files present) in this session — the "fresh machine" half of that claim (files
   absent, no lab run at all) is architecturally sound given the `[ -f ] ||` guard, but wasn't
   independently re-tested from a truly empty `~/mlx-lora-lab`.

7. **Expected-vs-real match: near-exact, all sections.** Every Expected-output block in both the
   Lab (Track A) and Deep Dive matched the real run to 2-3 significant figures or exactly:
   - Lab Step A-3 baseline: page shows illustrative loss values (Iter 50 Train loss 0.200 in the
     *lab's* "approximate" block); my real run: **Train loss 0.200, Val loss 0.148** — exact match.
   - Lab Step A-4 base-model generation: page's Expected text ("I apologize, but I don't have the
     capability to access or analyze specific alerts from Alibaba Cloud...") — my real output was
     **word-for-word identical** for the first two sentences.
   - Deep Dive baseline/Variant A/Variant B: all three training runs' loss trajectories and final
     Trainable-parameter percentages matched the page's Expected blocks exactly (e.g. Variant A:
     0.074% (0.367M/494.033M), final train loss 0.449, val 0.374 — exact).
   - Deep Dive generation comparisons (both training-distribution and held-out prompts): exact
     text match across all 3 adapters for both prompts.
   This is because the module targets a fixed model (`Qwen/Qwen2.5-0.5B-Instruct`), fixed data,
   fixed flags, and mlx-lm's default seeded RNG — genuinely deterministic on this stack. The
   pages' own "your numbers may differ" disclaimers are appropriately hedged (they correctly warn
   about cross-version/cross-run variance) even though in practice, on the exact pinned version
   (0.31.3) the deep-dive tests against, results reproduce almost to the decimal. This is a
   *stronger* match than the page promises, not a discrepancy — no action needed, but worth
   knowing the "your results will differ" framing is conservative for this particular module.

8. **Comparison-table numbers callout: page explicitly and correctly flags author-vs-learner
   variance.** Unlike a bare "Expected output" block, the Deep Dive's §6 comparison table is
   introduced with "Fold the results into this comparison table" using the author's own real
   numbers, and the prose around it repeatedly says "Real run," "Real result, and it complicates
   the prediction above" — explicitly modeling the *interpretation*, not asserting the exact
   digits are guaranteed. This matches what the QA brief asked to check for: the page does state
   (implicitly, via "Judge the run by the trend... not by matching the digits," and explicitly in
   the training-loss disclaimer in the Lab) that trend/shape is what to judge, not exact digits.
   No gap found.

---

## Timing per section

| Section | Wall time |
|---|---|
| Fetch + read Lesson (published HTML) | ~1 min |
| Fetch + read Lab (published HTML) | ~1 min |
| Fetch + read Quiz (published HTML) | <1 min |
| Fetch + read Deep Dive (published HTML) + slide deck verification | ~2 min |
| Lab Track A — Step A-1 (venv/install/verify) | <5 sec (already installed) |
| Lab Track A — Step A-2 (training data) | <1 sec |
| Lab Track A — Step A-3 (LoRA training, 50 iters) | **7.45 sec** wall-clock (model cached) |
| Lab Track A — Step A-4 (before/after generation, 2 runs) | ~3 sec total |
| Lab Track A — Step A-5 (fuse adapter) | ~5 sec |
| Lab Track A — Step A-6 (teardown, partial — deferred to end) | <1 sec |
| Deep Dive seed block (run twice, idempotence test) | <1 sec each |
| Deep Dive §6 baseline training | ~7.5 sec |
| Deep Dive §6 Variant A training (rank 4, config YAML) | ~7.5 sec |
| Deep Dive §6 Variant B training (lr 1e-4) | ~7.5 sec |
| Deep Dive §6 generation sweep (2 prompts × 3 adapters = 6 generations) | ~10 sec total |
| Deep Dive teardown + full module teardown | <1 sec |
| **Total hands-on execution time** | **well under 5 minutes actual compute** (page estimates "Track A ~20 min download + under a minute of actual training" and Deep Dive "~15 minutes" — both accurate or conservative given the model was already cached on this returning-learner machine; a cold-cache run would consume most of that 20 min in the HF download alone) |

---

## Seam verdicts

**Seam 1 — Lab → Deep Dive ("Go deeper" link + "Where this picks up"):**
**PASS.** The lab's closing "Go deeper" section correctly links to `/docs/m3b-finetuning/deep-dive`
and frames it accurately ("why rank 8? why that learning rate?... a side-by-side experiment you
can run in ~15 minutes"). The Deep Dive's "Where this picks up" seed block was tested from the
lab's actual end-state (train.jsonl/valid.jsonl present, venv already active) and ran cleanly,
idempotently, twice in a row (content-identical via md5, per Finding 6). The "fresh machine" path
(no prior lab run) was not independently executed in this session but is judged sound by
inspection: the `[ -f train.jsonl ] || cat > ...` guard means a truly empty directory would fall
through to the `cat > ...heredoc` and create the file correctly — same code path, different
starting condition. One caveat carried over from Finding 3: `cp -n`'s non-zero exit on macOS BSD
cp when the destination pre-exists (i.e., specifically the "ran the lab, teardown didn't run"
case) is the one sub-path that produces a non-fatal but non-zero exit code.

**Seam 2 — Deep Dive embeds a slide deck:**
**PASS.** Fetched `decks/03b-deepdive.html` directly (not the wrapping course page). Confirmed:
self-contained reveal.js (0 external `src`/`href` references to any `http(s)://` or protocol-
relative URL; ~1028 inline `reveal` string occurrences indicating a bundled runtime), 19
`<section>` slides, content verified to match all 6 of the Deep Dive page's numbered sections plus
its closing takeaways, with no topic drift or stale content. This is a materially better result
than the *lesson's own* deck (`decks/03b-finetuning.html`), which pulls reveal.js core/theme CSS,
reveal.js core JS, and a Google Font from external CDNs — flagged separately as Finding 2, since
the QA brief's self-containment bar applies by name to the Deep Dive's deck (which passes clean)
but the lesson's deck sharing the same course doesn't meet the same bar.

---

## Final machine state (post-teardown)

- `~/mlx-lora-env` — **kept** (396 MB), matches lab's Step A-6 guidance (commented-out `rm` line,
  optional retention for continued experimentation / M4 packaging reuse).
- `~/mlx-lora-lab` — **removed**, per lab Step A-6 (`rm -rf ~/mlx-lora-lab`), executed as the
  "fully done with the module" path recommended by the Deep Dive's own Teardown section.
- `~/.cache/huggingface/hub/models--Qwen--Qwen2.5-0.5B-Instruct` — **kept** (986 MB), matches
  lab's commented-out cache-clear line; other pre-existing cached repos
  (`models--cross-encoder--ms-marco-MiniLM-L-6-v2`, `models--Qwen--Qwen3-0.6B`) untouched.
- Docker: **no containers or images related to M3B were created** — `winglian/axolotl` was never
  pulled (Track B correctly left read-only per instructions); pre-existing containers/images from
  other modules (M6/M7/M8 course assets, unrelated Rancher Desktop state) are untouched and
  irrelevant to this module.
- No course files, planning files, or repo state were modified — QA was read-only against the
  published site plus local scratch execution under `~/mlx-lora-env` / `~/mlx-lora-lab` (both
  outside the repo).
