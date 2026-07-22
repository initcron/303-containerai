# Learner-QA Sweep 05 — M4 · Packaging Models & Apps (KitOps)

**Date:** 2026-07-22
**Site:** https://initcron.github.io/303-containerai/
**Pages walked (sidebar order, verified from live sidebar):** `docs/m4-packaging/lesson` → `docs/m4-packaging/lab` → `docs/m4-packaging/quiz` (no deep-dive page in the M4 category)
**Role:** first-time learner, published pages only, every command verbatim, record-don't-fix.
**Starting state:** learner clone of `schoolofdevops/303-containerai` in scratchpad (refreshed, `Already up to date`), Rancher Desktop running, native Ollama :11434 (qwen2.5:1.5b), `kit` 1.15.0 already at `/usr/local/bin/kit`, MLX venv `~/mlx-lora-env` + HF cache retained from M3B.

> **Run note:** the first QA dispatch (sub-agent) appeared hung for ~3h with no visible footprint
> and was abandoned per controller instruction; this walk was then executed directly, from scratch.
> The sub-agent's own report surfaced late, AFTER this direct walk finished — see the
> reconciliation note at the end. This document is the authoritative direct-walk report.

---

## Verdicts

| Page | Verdict |
|---|---|
| Lesson: Packaging Models as OCI Artifacts | **PASS** |
| Lab: Pack and Push a ModelKit with KitOps | **PASS-WITH-FINDINGS** (2 CONFUSING in Clean up, rest cosmetic) |
| Quiz: Module 4 | **PASS** |
| Seam M3B→M4 | **PASS** — no dependency on M3B artifacts |

**No BLOCKER findings.** The lab reaches its documented success end-state (pack → push → clean unpack → selective pull) on the page's own validated local-registry path.

---

## Lesson — PASS

Read top to bottom. Clear analogy-first structure (shipping manifest + labelled crates → Kitfile + typed layers; warehouse-by-chapter → selective pull). Tables (image-layer vs ModelKit-layer, KitOps vs `docker model package`, multi-registry targets) all render. Slides embed + fullscreen link present.

Verified in raw HTML: section 5 ("The full flow") shows only its italic caption in static HTML with a `<!-- -->` placeholder — this is the normal Docusaurus client-side Mermaid SSR pattern (calibrated against M1/M2/M3B lesson HTML, which behave identically), so the diagram renders in a real browser. Not a finding.

The lesson ends by promising exactly what the lab delivers. No leaked author notes, no wrong repo/path names.

## Lab — PASS-WITH-FINDINGS

Every step executed verbatim from the learner clone, in order. Expected-output blocks matched **by shape** throughout; exact-text matches where the page implies them (Kitfile, prompts.txt, `Version: 1.15.0`, `100.5 MiB` in `kit list`, `Pushed sha256:...`, model-layer digest `c0f4f53...`).

### Step-by-step log

**Step 1 — Install kit.** Ran the printed `curl … | tar xz -C /tmp && sudo mv /tmp/kit /usr/local/bin/kit` verbatim (as a plain sh script to avoid the local rtk pipe-rewriting hook). Download + extract succeeded (`/tmp/kit`, 21.7M, reports exactly `Version: 1.15.0`, byte-equivalent to the pre-installed binary). The `sudo mv` failed **only in this sandbox** (`sudo: a terminal is required to read the password`) — machine-local automation fact, not a course finding; a real learner types their password. The already-installed state caused zero friction (the command is naturally idempotent — overwrite). `kit version` verify: first line matches the Expected block; actual prints 3 extra lines (Commit/Built/Go) — acceptable abbreviation.

**Step 2 — Get the model weights.** `cd labs/m4`, `mkdir -p model`, printed `curl -L -o model/… bartowski/SmolLM2-135M-Instruct-GGUF …` — 100M downloaded in **3m11s**. `ls -lh model/` → `101M SmolLM2-135M-Instruct-Q4_K_M.gguf` vs Expected `100.6M` — macOS BSD `ls` rounding, shape match (F5). The `.gitignore` claim checks out.

**Step 3 — Review Kitfile + prompts.** `cat Kitfile` and `cat prompts.txt` — **exact match** with both Expected blocks.

**Step 4 — Pack.** `kit pack . -t ghcr.io/initcron/acme-docs-model:1.0.0`:

```
Saved model layer: sha256:c0f4f53235c650e36fe5897432b8ffd227be40a100619fbe92709c548740aa29
Saved code layer: sha256:fc86b3d925423a6ce261521da71793a297f45f1968ddce837b489d15eaa12578
Saved configuration: sha256:5591f216...
Saved manifest to storage: sha256:1861c1e5...
Model saved: sha256:1861c1e5...
```

Model-layer digest **matches the page's** `c0f4f53...` (deterministic weights layer). Page condenses the last three lines into one "Saved configuration + manifest:" line (F4). `kit list` shows the kit with `100.5 MiB` — exact size match — but with an extra `MAINTAINER` column the Expected omits (F3).

**Step 5 — GHCR login.** Not executed: option A is an interactive browser device-code flow (the page itself warns to run it only in a real interactive terminal); option B needs a personal classic PAT. Neither is available to this automated run, and running `gh auth refresh` would mutate this machine's real gh credentials. The page explicitly offers **option C → Step 5b as the validated path** — took that. (The page working as designed, not a finding.)

**Step 5b — Local registry.** `docker run -d -p 5001:5000 --name m4-registry registry:2` → up instantly (image cached). `kit tag …` → `Modelkit … tagged as localhost:5001/acme-docs-model:1.0.0`. `kit push --plain-http …` → `Pushed sha256:1861c1e5…` — matches Expected shape exactly.

**Step 6 — Portability.** `kit remove localhost:5001/…` → `Removed … (digest sha256:1861c1e5…)`. `kit unpack --plain-http … -d /tmp/m4-clean` → Kitfile + model + code all restored. `ls -lh /tmp/m4-clean/model/*.gguf` → `101M` (shape). `ls /tmp/m4-clean/` → `Kitfile model prompts.txt` (Expected shows `model/` with slash plain `ls` doesn't print — F5). Real unpack output is 4 distinct lines vs the page's one slash-joined paraphrase line (F5).

**Step 7 — Selective pull.** `kit unpack --plain-http … --filter=model -d ./weights-only` → only the model layer. `ls ./weights-only/` → `model` only — no Kitfile, no prompts.txt. **The selective-pull payoff proven exactly as documented.**

**Clean up (printed teardown, run verbatim from `labs/m4` — where Step 2's `cd` leaves you and where the block's own `(from labs/m4/)` comment points):**

1. `docker rm -f m4-registry` → `m4-registry` — registry container removed. ✔
2. `kit remove localhost:5001/acme-docs-model:1.0.0` → **`[ERROR] Failed to remove: model localhost:5001/acme-docs-model:1.0.0 not found`** (exit 1) — Step 6 already removed this tag; nothing re-created it (F1).
3. `kit remove ghcr.io/initcron/acme-docs-model:1.0.0` → `Removed … sha256:1861c1e5…` ✔ (kit store now empty).
4. `rm -rf labs/m4/model /tmp/m4-clean labs/m4/weights-only` → exit 0; `/tmp/m4-clean` deleted, but **`model/` (112M) and `weights-only/` (114M) still present** — the repo-root-relative paths silently no-op from the `labs/m4` cwd (F2).

## Quiz — PASS

5 questions, all grounded in lesson/lab content: OCI-fit for models (multi-select, with a correctly-false "compress to near-zero" distractor), Kitfile-as-manifest, the real `kit unpack … --filter=model` syntax vs invented-flag distractors, the exact `denied: permission_denied: token … scopes` failure from Step 5, KitOps vs `docker model package`. Prompts and all options present in the served HTML (SSR — component received correct props, no blank-render); "Check answers" + "Reset" controls present. Interactive checking needs JS, not exercisable via static fetch; no issue observed.

## Seam M3B→M4 — PASS

- **Zero M3B artifact dependency.** M4 never references the MLX venv, the LoRA adapter, the fused checkpoint, or the HF cache. M3B fine-tuned Qwen2.5-0.5B; M4 packages a different model entirely — SmolLM2-135M GGUF — downloaded **fresh in Step 2 with a complete, working curl command**. A learner who skipped M3B (it is marked optional) completes M4 unaffected.
- The only backreference is narrative and accurate: "the same tiny model you served in **M3**" (M3 vLLM, not M3B).
- **No leftover-state interference.** Port 5001 free; container name `m4-registry` unique; kit store started empty. The lab even ran cleanly with a *foreign* stack up (another session's opsmate/litellm/presidio containers on :8001/:4000) — no collisions.
- Retained M3B state (`~/mlx-lora-env`, HF cache) untouched by M4 — the retention design holds.

---

## Findings

| # | Page + step | Severity | Detail |
|---|---|---|---|
| **F1** | Lab · Clean up, cmd 2 | **CONFUSING** | `kit remove localhost:5001/acme-docs-model:1.0.0` fails with `[ERROR] Failed to remove: model localhost:5001/acme-docs-model:1.0.0 not found` on the lab's own recommended path — Step 6 already removed this tag and `kit unpack` doesn't restore it. A linear learner ends the module on a scary `[ERROR]` that is actually benign. Fix direction: drop the line, note "already removed in Step 6", or have Step 6 re-tag. |
| **F2** | Lab · Clean up, cmd 4 | **CONFUSING** | `rm -rf labs/m4/model /tmp/m4-clean labs/m4/weights-only` — paths are repo-root-relative but the flow leaves the learner in `labs/m4` (Step 2's `cd`), and the comment `(from labs/m4/)` reads as "run this from labs/m4". Run there it exits 0 and silently deletes nothing local: `model/` (112M) and `weights-only/` (114M) remain — ~226 MB left behind despite "This keeps your disk clean." Corroboration: two independent walks read this block's cwd differently (see reconciliation note) — the ambiguity is real. |
| **F3** | Lab · Step 4, `kit list` | COSMETIC | Expected header `REPOSITORY TAG NAME SIZE DIGEST` omits the `MAINTAINER` column kit 1.15.0 actually prints. Size `100.5 MiB` matches exactly. |
| **F4** | Lab · Step 4, `kit pack` | COSMETIC | Expected shows 3 condensed lines ("Saved configuration + manifest: …"); actual prints 5 (`Saved configuration:`, `Saved manifest to storage:`, `Model saved:` separately). Model-layer digest `c0f4f53…` matches the page. |
| **F5** | Lab · Steps 2 & 6, size/ls formatting | COSMETIC | Page Expected `100.6M`; macOS BSD `ls -lh` prints `101M` (rounding). Step 6 unpack Expected is a one-line slash-joined paraphrase vs 4 real output lines; `ls /tmp/m4-clean/` Expected shows `model/` with a trailing slash plain `ls` doesn't print. |
| **F6** | Lab · Clean up, intro prose | COSMETIC | Prose says the lab created "the signing keys" and implies cleanup removes them — no step created signing keys and no cleanup command touches any. |

## Machine-local observations (facts, not findings)

- `docker` CLI at `~/.rd/bin` (not on default PATH) — all docker commands run with `PATH="$HOME/.rd/bin:$PATH"`; authored prose correctly uses plain `docker`.
- `kit` 1.15.0 pre-installed; Step 1's install is idempotent, so the already-installed state caused zero flow break. In this sandbox the `sudo mv` half failed for lack of a TTY; the curl/tar half fully succeeded and the extracted binary is byte-equivalent v1.15.0. Leftover: `/tmp/kit` (21.7M).
- rtk pipe-rewriting hook dodged by running the piped install as a plain `.sh` file.
- A **foreign container stack from another session** (opsmate-app :8001, gateway-litellm-1 :4000, gateway-pg-1, presidio analyzer/anonymizer) was running throughout the walk — contradicts the "zero course containers" starting premise but caused no interference with M4; left untouched.

## Timing

| Section | Time |
|---|---|
| Page fetch + lesson read | ~6 min |
| Step 1 (install + verify) | ~1 min |
| Step 2 (model download) | ~3.5 min (3m11s download) |
| Steps 3–4 (review + pack + list) | ~1 min |
| Step 5b (registry + tag + push) | ~30 s |
| Step 6 (remove + unpack + verify) | ~30 s |
| Step 7 (selective pull) | ~15 s |
| Quiz read | ~2 min |
| Clean up + final-state capture | ~1 min |
| **Total** | **~15 min** (page's "~25 minutes + one-time ~100 MB download" is honest, slightly generous) |

## Final machine state (after printed teardown, exactly as printed)

- **Containers:** `m4-registry` removed; no course containers from this walk. Still running (foreign, other session, untouched): opsmate-app, gateway-litellm-1, gateway-pg-1, gateway-analyzer-1, gateway-anonymizer-1; pre-existing exited leftovers `gracious_haibt`, `hub-dev-postgres`.
- **Images:** `registry:2` remains cached (teardown removes the container only — consistent with what's printed). m2/m3 course images cached as before.
- **kit store:** empty (`kit list` → header only).
- **Files:** `/tmp/m4-clean` deleted. **Left behind by F2:** `labs/m4/model/` (112M) + `labs/m4/weights-only/` (114M) in the scratchpad learner clone. `/tmp/kit` (21.7M) from Step 1's extract (sandbox sudo byproduct).
- **M3B state:** `~/mlx-lora-env` and `~/.cache/huggingface` present and untouched. Native Ollama :11434 untouched (M4 never uses it).

---

## Reconciliation note — late sub-agent report

The originally-dispatched QA sub-agent, presumed hung and abandoned, turned out to have completed a full walk of its own and wrote its report to this path minutes AFTER this direct walk finished (it was overwritten by this authoritative version; key deltas preserved here):

- **Verdicts identical** (PASS / PASS-WITH-FINDINGS / PASS / seam PASS). Its F5 = this report's F1 (teardown `kit remove` ERROR); its cosmetic set matches F3–F5 here.
- **Material delta → strengthens F2:** the sub-agent ran the cleanup `rm -rf` **from repo root** ("as the `labs/m4/...` paths imply") and got a clean disk; this walk ran it **from `labs/m4`** (where the flow's `cd` leaves you, and as the `(from labs/m4/)` comment suggests) and got the silent no-op with ~226 MB left behind. Two independent literal readers chose different cwds for the same block — the ambiguity is demonstrably real and the block only "keeps your disk clean" on one of the two readings.
- The sub-agent did not surface F2 or F6; this walk did not surface anything the sub-agent found that is missing above.
