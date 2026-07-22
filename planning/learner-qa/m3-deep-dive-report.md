# Module 3 Learner QA — Full Module Including Deep Dive (Part 2)

**Date:** 2026-07-22
**Learner role:** fresh, first-time, published pages only, no source/planning access
**Site:** https://initcron.github.io/303-containerai/ (redirects 301 → schoolofdevops.github.io/303-containerai, same content)
**Pages walked in sidebar/discovered order:** Lesson → Lab → Quiz → Deep Dive (Part 2)
**Repo:** fresh clone of schoolofdevops/303-containerai already present in scratchpad, `git status` clean vs origin/main at start.

---

## Sidebar-order note (important, affects verdicts below)

The M3 sidebar (confirmed via the actual rendered `menu__link` markup on lesson/lab/quiz pages, and
the `pagination-nav__link` prev/next chain on every M3 page) contains **only three entries: Lesson,
Lab, Quiz.** Deep Dive is **not in the sidebar at all** and **not in the pagination-nav chain** on any
page — lesson's "next" goes to lab, lab's "next" goes to quiz, quiz's "prev" goes to lab. The only way
to reach Deep Dive is one inline link inside the lab page's "Go deeper" section
(`/303-containerai/docs/m3-vllm/deep-dive`). A learner who finishes the quiz and looks for "what's
next" via the pagination arrows will never see it. This affects the "sidebar order" framing of the task:
there effectively is no sidebar position for Deep Dive — it is a hidden/orphan page reachable only via
one prose link.

---

## Verdict per page

| Page | Verdict |
|---|---|
| Lesson (`m3-vllm/lesson`) | **PASS** |
| Lab (`m3-vllm/lab`) | **PASS-WITH-FINDINGS** |
| Quiz (`m3-vllm/quiz`) | **PASS** |
| Deep Dive (Part 2) (`m3-vllm/deep-dive`) | **PASS-WITH-FINDINGS** (one BLOCKER, workaround exists via the lab's own compose commands) |

---

## Numbered findings

### F1 — Deep Dive's seam entry/exit scripts do not exist — BLOCKER
- **Page + step:** Deep Dive, "Where this picks up" (top of page) and "Teardown" (bottom of page).
- **Command:** `cd labs/m3` then `bash up.sh` (entry); `cd labs/m3 && bash down.sh` (teardown).
- **Expected:** Container comes up / goes down with the printed Expected-output block (`Container vllm-smollm2 Starting/Started` / `Stopping/Stopped/Removing/Removed` + network/volume lines).
- **Got (verbatim):**
  ```
  bash: up.sh: No such file or directory
  ```
  and
  ```
  bash: down.sh: No such file or directory
  ```
  `labs/m3/` on the actual clone contains only `.env.example`, `compose.yaml`, `Dockerfile`, `README.md` — no `up.sh` or `down.sh` at any point in this walk (before or after the lab ran). The lab's own README documents `docker compose build` / `up -d` / `down`, never `up.sh`/`down.sh`.
- **Severity:** BLOCKER as literally written. A first-time learner who has not seen the lab's own compose vocabulary has no way to resolve `up.sh`/`down.sh` from the page itself — there's no fallback command shown. Recoverable in practice only by already knowing (from the lab, three pages earlier) that `docker compose up -d` / `docker compose down` are the real commands. I substituted the compose-equivalent commands to continue testing the rest of the page; they worked correctly (see F1 note below).
- **Secondary observation:** Deep Dive's own printed teardown Expected-output shows **volume removal** (`Volume m3_hf-cache Removing/Removed`) alongside container removal — i.e. as printed, `down.sh` implies `docker compose down -v` semantics. That's inconsistent with the Lab page's own Step 6, where plain `docker compose down` (no `-v`) is the primary/first teardown command and volume removal is a separate, explicitly optional second command. If `down.sh` is ever authored, its behavior should match one of the two documented lab behaviors, not silently combine them.

### F2 — Lesson and Deep Dive both lack a Mermaid diagram despite spatial content — COSMETIC
- **Page + step:** Lesson §"PagedAttention = virtual memory for the KV cache"; Deep Dive §1–§3 (block tables, contiguous-vs-paged memory, continuous batching scheduler loop).
- **Expected (course convention, visible nowhere on the page itself, but the content is unmistakably spatial/architectural — KV-cache block layout, scheduler admit/evict flow):** at least one Mermaid diagram.
- **Got:** Checked raw page source for `` ```mermaid `` fences / `mermaid` class markers on both pages — none present on either. All spatial concepts are explained in prose + analogy only.
- **Severity:** COSMETIC. Not a blocker for a learner — the analogies (hotel/room for PagedAttention, restaurant reseating for continuous batching) are strong and carry the concept well on their own, and the Deep Dive's companion slide deck (`03-deepdive.html`) does contain hand-illustrated box/arrow visuals for these exact concepts (see seam verdict 2). Flagging only because the content is exactly the kind CLAUDE.md's own authoring rule calls out as requiring a diagram on the page itself, and a learner who doesn't click through to the deck (deck link is easy to miss, see F1's sidebar note) gets prose-only for a memory-layout concept.

### F3 — Lab Step 4's "already the default" claim is wrong — CONFUSING
- **Page + step:** Lab, Step 4 "Tuning knobs," the `.env` edit block.
- **Command/prose:** `MAX_NUM_SEQS=4       # already the default — lower it further to trade concurrency for memory`
- **Expected:** implies the learner's freshly-copied `.env` (from `cp .env.example .env` two steps earlier) already has `MAX_NUM_SEQS=4`.
- **Got (verbatim, from the real `.env.example` in the clone):** `MAX_NUM_SEQS=8           # concurrent sequences the batcher packs together`
- **Severity:** CONFUSING. The compose.yaml's hard-coded fallback default (used if `.env` is absent) is indeed 4, but the `.env.example` a learner is told to copy in Step 4 itself sets 8. A learner who reads `cat .env` right after `cp .env.example .env` (encouraged elsewhere in the lab) will see 8, not 4, and the page's parenthetical will read as wrong. Not a blocker — editing the line to 4 works fine — but it undermines trust in the "already the default" claim.

### F4 — First `docker compose up -d` progress output has one more line than the page's Expected block — COSMETIC
- **Page + step:** Lab, Step 2, `docker compose up -d`.
- **Expected:**
  ```
  [+] Running 2/2
   ✔ Volume "m3_hf-cache"      Created
   ✔ Container vllm-smollm2    Started
  ```
- **Got (verbatim):**
  ```
   Network m3_default Creating
   Network m3_default Created
   Volume m3_hf-cache Creating
   Volume m3_hf-cache Created
   Container vllm-smollm2 Creating
   Container vllm-smollm2 Created
   Container vllm-smollm2 Starting
   Container vllm-smollm2 Started
  ```
- **Severity:** COSMETIC — the lab's own "Your output won't match character-for-character" callout explicitly pre-empts this class of variance (Docker Compose version differences in progress-line verbosity). Recorded for completeness, not actionable.

### F5 — MACHINE-LOCAL: host port 8009 stale forward (not a course defect)
- **Page + step:** Lab Step 2 `/health`, Step 3a/3b/3c; Deep Dive throughout (every `${VLLM_PORT:-8009}` command).
- **Command:** `curl http://localhost:8009/health` (and all subsequent 8009 calls).
- **Expected:** HTTP 200 empty body.
- **Got (verbatim):** `* Recv failure: Connection reset by peer` — container itself reports `healthy` in `docker ps` throughout; only the host-side 8009 forward is broken.
- **Classification:** MACHINE-LOCAL per the task's own pre-briefed machine note, not a course finding. Both the Lab and the Deep Dive already carry their own guidance for this: the Lab's compose.yaml exposes `VLLM_PORT` as an override variable, and the **Deep Dive has an explicit, well-written callout** ("If port 8009 refuses connections on your machine…") with the exact fix (`export VLLM_PORT=8010`). I followed that documented path (`VLLM_PORT=8010`) for the remainder of both pages once it appeared, and it worked cleanly every time thereafter. Worth noting as a course-quality positive: the Deep Dive's handling of this exact machine issue is better than the Lab's (Lab never explicitly shows the override syntax inline in a command the way Deep Dive does — it only implies it via the compose.yaml comment).

### F6 (environment artifact, not a course finding): rtk shell hook mangles piped commands run directly in Bash
- Running the page's exact piped commands (`curl ... | python3 -m json.tool`) directly in my Bash tool produced a bogus, invalid-JSON "schema stub" response (unquoted keys, literal type names like `string`/`int`/`bool` instead of real values) — not an error from vLLM, but a local shell-hook artifact rewriting the pipeline. Wrapping the identical command in a plain `.sh` script and executing that produced the correct, valid JSON every time. Recorded per the task's pre-briefed machine note ("rtk hook mangles pipes → plain sh scripts"); not a course or lab defect — it never affected the actual server, only how my tool captured its output.

---

## Timing

| Step | Time |
|---|---|
| Docker image build (`docker compose build`) | ~3s — **not representative**; base image `openeuler/vllm-cpu:0.9.1-oe2403lts` was already cached on this machine from unrelated prior work. A genuinely cold pull would take the "multi-GB, several minutes" the page describes. |
| First `docker compose up -d` → healthy (incl. model download) | ~108s (16:34:02 → 16:35:50), ~78s of which was the HF weight download for the 135M model | 
| Second `up -d` after `.env` edit (model cached) → healthy | ~57s (engine re-init only, no download) |
| Step 3b chat completion (first live call) | ~7.9s |
| Step 3c M2-client cross-check (via docker compose run) | ~15.9s |
| Deep Dive §6 sequential vLLM (4 prompts) | 22.5s real (page's own capture: 19.673s) |
| Deep Dive §6 sequential Ollama (4 prompts) | 3.7s real (page's own capture: 3.765s — close match) |
| Deep Dive §6 concurrent vLLM (3 prompts) | 8.4s real |
| Deep Dive §6 matched sequential vLLM (3 prompts, for scaling calc) | 21.5s real |
| Deep Dive §6 concurrent Ollama (3 prompts) | 1.2s real |
| Deep Dive §6 matched sequential Ollama (3 prompts) | 1.7s real |
| Full module walk (lesson read → lab executed → quiz read → deep-dive executed → teardown) | ~35 minutes wall clock |

**Expected-vs-real assessment on cold-start framing:** the Lab's "First run is slow — this is expected" and Deep Dive's implicit reliance on a cached container both set the right expectation *in principle*, but my own build was accelerated by pre-cached layers from unrelated prior work on this machine, so I cannot independently confirm the page's "multi-GB pull, several minutes" framing from a truly cold state on this run — the ~108s observed (dominated by the 78s HF download, not the image pull) is consistent with, but does not stress-test, that claim. The model-download portion of the wait matched the page's framing well; nothing hung, nothing silently failed.

---

## Throughput-shape assessment (Deep Dive §6, the core ask)

The page explicitly frames its numbers as **shape, not benchmark**, and gives its own captured
numbers: vLLM-CPU scales **3.13x** from sequential→concurrent (3 prompts) while Ollama scales only
**1.10x** over the same comparison, and states plainly that Ollama wins on absolute tokens/sec at this
toy CPU scale.

My independently-measured run on this machine:

| | Sequential (matched 3-prompt set) | Concurrent (3 prompts) | Scaling factor |
|---|---|---|---|
| vLLM-CPU | 21.547s | 8.395s | **2.57x** |
| Ollama (native) | 1.660s | 1.217s | **1.36x** |

**Verdict: the shape claim holds independently.** Absolute magnitudes differ from the page's captured
numbers (expected — the page itself disclaims machine-to-machine noise), but the *directional* claim —
vLLM-CPU scales meaningfully better under concurrency than Ollama, even though Ollama is faster in
absolute tok/s at this toy scale — reproduced cleanly on this run. Ollama also won on absolute
tokens/sec on my machine, matching the page's own "headline" framing exactly. I do not think the
framing misleads; if anything it under-claims (my vLLM scaling ratio was smaller than the page's, not
larger, so a learner who gets a less dramatic ratio than the page's captured 3.13x is still solidly
inside the claimed direction, not contradicting it).

One nuance the page doesn't explicitly flag: it computes its scaling factor as "sequential(4 prompts,
19.673s) vs concurrent(3 prompts, 3.965s)" in the prose narrative immediately preceding the results
heredoc, but the *actual* 3.13x figure inside the heredoc is computed from a **separate matched-set
sequential run of the same 3 prompts** (12.393s), not the earlier 4-prompt sequential run. The
distinction is correct and the heredoc itself is internally consistent and clearly labeled
("Matched-set sequential... for fair scaling comparison"), but the page never shows the matched-set
sequential command as its own explicit code block — it's asserted as pre-captured evidence inside the
results-file heredoc. A learner copy-pasting only the visible commands cannot independently reproduce
the exact 3.13x figure without inferring that a third (matched 3-prompt, non-concurrent) run has to be
made — I had to construct that command myself from the concurrent block's own prompt list. This is
minor (CONFUSING, not a blocker) since the page is honest that these are "folded in during live
validation" numbers and the concept is understandable without reproducing the exact figure, but it's
worth the author's awareness: the "Expected output" reasoning chain uses a fourth curl call that isn't
printed as a runnable step anywhere on the page.

### F7 — Matched-set sequential baseline used in the scaling-factor arithmetic is never shown as a runnable command — CONFUSING
- **Page + step:** Deep Dive §6, results-file heredoc (`cat > ~/vllm-deepdive-lab/comparison-results.txt`).
- **Expected:** the scaling factor (3.13x / 1.10x) should be reproducible from the commands printed above it on the page.
- **Got:** the heredoc's numbers cite a "matched-set sequential (same 3 prompts as concurrent run)" result (`12.393s` for vLLM, `1.427s` for Ollama) that has no corresponding runnable code block anywhere earlier on the page — only the 4-prompt sequential and the 3-prompt concurrent blocks are shown as copy-runnable.
- **Severity:** CONFUSING. Doesn't block completing the page (the heredoc is copy-pasted as-is, so nothing fails), but a learner trying to understand or reproduce the 3.13x/1.10x scaling claim from the page's own visible steps cannot do so without inferring and constructing the missing third command themselves, as I did.

---

## Seam verdicts

### Seam 1 — Lab → Deep Dive ("Go deeper")
**Verdict: WORKS, with the F1 caveat.**

The lab's "Go deeper" section links correctly to `/303-containerai/docs/m3-vllm/deep-dive` and frames it
accurately ("PagedAttention's memory paging, continuous batching, what every flag you set actually did,
and a live throughput experiment against Ollama" — all four are genuinely covered). I tested the seam
from the **actual post-lab state** (vLLM container still running on port 8010 after the MACHINE-LOCAL
port fix, `.env` present, lab teardown *not yet run*) — exactly the scenario the Deep Dive's own
"Where this picks up" note says it's designed for ("This works whether it's currently running or was
torn down after the lab — the check below is idempotent"). The **idempotency claim about `up.sh` is
untestable as written** because `up.sh` doesn't exist (F1) — I can't confirm it's actually idempotent
against a running container since the script never ran. Substituting `docker compose up -d` (which
genuinely is idempotent — Compose recognizes an already-correct running container and no-ops or
recreates cleanly) satisfied the intent, and the reachability check (`curl .../v1/models`) correctly
reported `vllm: up` against my already-running container once the port override was applied. So: the
conceptual seam (does the deep-dive's premise hold against real post-lab state) is sound; the literal
scripted seam (`bash up.sh`) is broken.

### Seam 2 — Embedded deck (`decks/03-deepdive.html`)
**Verdict: PASS — self-contained and content-consistent.**

Fetched directly (237,456 bytes). Zero external `<script src="http...">` or `<link href="http...">`
references — fully self-contained (inline styles/script, no CDN dependency), unlike the module's
concept deck (`decks/03-vllm.html`, linked from the Lesson page) which pulls three CDN resources
(reveal.js JS/CSS from cdnjs, a Google Fonts stylesheet) and would not render offline. The deep-dive
deck's 18 slides cover exactly the deep-dive page's five sections plus takeaways, using the *same*
analogies (hotel/room-by-room for PagedAttention, restaurant table-clearing for continuous batching)
and the *same* verified facts (`num_cpu_blocks="0"`, the 3.13x/1.10x scaling numbers, the
1456-blocks/22.75x-concurrency arithmetic) as the prose page. No contradictions found between deck and
page.

---

## Final machine state (post-teardown)

- `docker ps -a`: no `vllm-smollm2` container (removed via `docker compose down` then `docker compose down -v`, following the Lab's own printed Step 6 exactly).
- `docker volume ls`: no `m3_hf-cache` volume (removed via the `-v` teardown).
- `vllm-cpu-optimized:latest` image **still present** (5.41GB) — neither the Lab nor the Deep Dive teardown instructs removing the built image, so this is correct/expected, not leftover cruft.
- Native Ollama (`:11434`, `qwen2.5:1.5b`) — **still running**, per the Deep Dive's explicit teardown instruction ("leave native Ollama running — other modules and this page's own re-runs depend on it staying up"). Confirmed reachable (`GET /api/tags` → 200) after all M3 teardown steps.
- `~/vllm-deepdive-lab/` — removed per the Deep Dive's own optional cleanup line (`rm -rf ~/vllm-deepdive-lab`).
- Repo working tree: only `labs/m3/.env` left as an untracked file (expected learner artifact from `cp .env.example .env`, Lab Step 4) — no other course file touched or modified. Pre-existing unrelated untracked files (`grype_err.txt`, `trivy_out.txt`, etc.) predate this session and were not created by this walk.
- No lingering M3 containers, networks, or volumes of any kind.

---

## Controller adjudication (2026-07-22)

- F1 (up.sh missing) + F3 (MAX_NUM_SEQS default) — **FALSE POSITIVES: stale scratchpad clone.** Public repo serves labs/m3/up.sh (HTTP 200) and .env.example says MAX_NUM_SEQS=4, matching the lab. Walker reused a pre-v1.1.0 clone.
- F2 (no Mermaid) — false positive: client-rendered Mermaid; page source has 3 fences (lesson 2).
- F4 — pre-disclaimed cosmetic, no action. F5/F6 — machine-local, no action.
- F7 — REAL, fixed in 13bf296 (matched-set baseline now a runnable step).
- Process fix going forward: QA walkers must `rm -rf` + re-clone fresh every run.
