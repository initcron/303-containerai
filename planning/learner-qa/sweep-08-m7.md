# Learner QA Sweep 08 — M7 · Multi-Agent Incident Crew

**Date:** 2026-07-22
**Site:** https://initcron.github.io/303-containerai/ (sitemap `<loc>` resolves to `schoolofdevops.github.io` — same build, likely CNAME/alias; content identical)
**Scope:** M7 lesson, lab, quiz (published pages, sidebar order). M6→M7 seam. Lab executed live on Rancher Desktop + native Ollama.
**Role:** strict first-time learner — no prior context beyond the published pages. Nothing fixed, nothing edited.

---

## Verdict per page

| Page | Verdict | Notes |
|---|---|---|
| Lesson: Multi-Agent Incident Crew | **PASS with 1 finding** | Content is clear, analogy-first, well-structured. Missing the required Mermaid diagram for the spatial pipeline section (Finding 1). |
| Lab: Multi-Agent Incident Crew | **PASS with 3 findings** | All 7 steps executed successfully, fast (seconds, not minutes), no hangs, no degenerate output. Expected-output blocks matched in shape; some prose/format details diverged as small-model variance (Findings 2, 3, 4). |
| Quiz: Multi-Agent Incident Crew | **PASS** | 5 questions, schema-conformant, one multiSelect, options plausible and distinct. No structural issues found from static HTML (interactive reveal not inspectable via curl, expected). |

---

## Findings

1. **[Lesson, Section 3 "The incident crew's pipeline"] — CONFUSING.** CLAUDE.md course convention requires "at least one diagram where the topic is spatial/flow/architecture," and this section is explicitly a sequential pipeline (Triage → Investigator → Fixer → Reviewer, with a relevance-gate short-circuit) — a textbook Mermaid candidate. The rendered lesson page has **zero** `<pre>`/Mermaid elements anywhere (confirmed via `grep -c mermaid` on raw HTML → 0 matches). The pipeline and the relevance gate are described in prose only. A first-time learner has to build the mental picture unaided, which is exactly what this convention exists to prevent.

2. **[Lab, Step 5 "Run the escalate path"] — COSMETIC.** The page's Expected-output block shows the Triage line with full labels: `[TRIAGE]      AREA: Kafka | SEV: 3 | Event streaming cluster stalled.` My actual run produced `[TRIAGE]      Kafka | SEV3 | Cluster shutdown due to network connectivity issues.` — missing the `AREA:` / `SEV:` label prefixes the Triage profile explicitly mandates (`Output exactly: AREA: <area> | SEV: <n> | <one-line summary>`). Step 4 and Step 6 runs *did* produce correctly labeled output. This is small-model format non-adherence (qwen2.5:1.5b), which the page's own Troubleshooting section acknowledges in general terms ("small-model determinism") — but the specific prompt-adherence failure (dropping required labels, not just wording drift) isn't called out. Outcome (REJECTED — escalate) was correct regardless; the crew's decision-making logic was unaffected.

3. **[Lab, Step 4 "Run the approve path"] — COSMETIC.** Expected-output block is abbreviated/illustrative (shows a short one-liner for `[INVESTIGATOR]`); actual output is a multi-line runbook excerpt (the real retrieved chunk, ~4 lines). This is expected given ChromaDB returns full document chunks, but a first-time learner comparing their terminal to the page verbatim could be confused about whether the multi-line output is "correct." The page does not warn that Expected blocks are truncated/illustrative rather than exact. Judged by shape (stage markers present, correct final OUTCOME) this is a clean pass; judged by exact prose it would not match.

4. **[Lab, "CrewAI framework variant" section] — CONFUSING.** The section discusses `reference-repos/compose-for-agents/crew-ai/` as if already present ("The reference repository ... shows a CrewAI crew defined in agents.yaml and tasks.yaml") but this directory does not exist in the course repo clone (`reference-repos/` is entirely absent — confirmed via `find`; per the root CLAUDE.md it's gitignored/cloned separately, but no clone command is given anywhere in M7's lesson or lab). A learner following the lab exactly as written cannot inspect the file described, and no earlier module (per the M7 lab text) establishes it either. This section reads as reference/optional (no directly-run commands attached to it — `thv run duckduckgo` is illustrative prose, not marked as a required step), so it did not block lab completion, but a learner trying to be thorough would hit a dead end.

## Machine-local observations (facts, not findings)

- `docker` CLI resolved via `~/.rd/bin` PATH prefix, as documented in project CLAUDE.md.
- The `rtk` shell hook mangles flagged/piped `docker` commands (e.g., `docker ps -a --format ...` erroring with `unexpected argument '-a'`). Wrapping in `sh -c '...'` bypasses the hook cleanly and was used throughout for raw capture.
- Both `qwen2.5:1.5b` and `nomic-embed-text` were already present in Ollama's model store before this sweep (per the stated starting state); the two `ollama pull` prerequisite commands completed near-instantly (~1.7s, ~1.4s) as cache hits — no download occurred, no Expected-output block was given for this step so no mismatch to report.
- All three lab crew runs (503 approve, Kafka escalate, payments approve) completed in 2.5–6 seconds each — far under the 10-minute hang threshold. No retry was needed. No degenerate/garbled output observed on any run; qwen2.5:1.5b handled the pipeline reliably across all three incidents.
- A pre-existing `m7_chroma_data` volume was present at sweep start (residue from an earlier sweep run in this same environment) and was reused rather than freshly created by `docker compose up -d chromadb` in Step 3 — Docker Compose silently attaches to an existing named volume rather than erroring or warning. This is a seam observation, not a lab defect: the lab's own Step 7 teardown never removes volumes by design (matches the M2–M6 pattern), so this is the expected, intended behavior of repeat runs — but it means a learner re-running this lab a second time (or an environment with leftover state) never gets a truly "fresh" ChromaDB ingest unless they also `docker volume rm m7_chroma_data`. The lab doesn't mention this.
- Unrelated author containers (`gracious_haibt`, `hub-dev-postgres`, exited) and unrelated volumes/networks (from other projects: `deploy_*`, `agentsre_sresquad_*`, `opsmate_default`, `mlflow_default`, `house-price-predictor_default`, `kind`, etc.) were present throughout and were not touched, per instructions.

## Timing per section

| Step | Elapsed |
|---|---|
| Prerequisites (`ollama pull` x2) | ~1.7s + ~1.4s (cache hits) |
| Step 1 — read agent profiles (4x `cat`) | instant |
| Step 2 — skim crew.py (`cat`) | instant |
| Step 3 — `docker compose up -d chromadb` | ~1.2s |
| Step 4 — approve path (503, build+run) | ~6.1s |
| Step 5 — escalate path (Kafka) | ~2.5s |
| Step 6 — payments scenario | ~3.6s |
| Step 7 — `docker compose down` | ~1.4s |
| **Total lab wall-clock** | **under 20 seconds of container/model work** (excluding read/inspection steps) |

No multi-minute waits occurred; the course's own caveat about multi-agent crews against a small local model "taking several minutes" did not manifest here — likely because these are four short sequential single-turn calls (not agentic tool-loop reasoning), and qwen2.5:1.5b + this machine's resources handled them quickly.

## Expected-output block match summary

| Step | Matched exactly? | Notes |
|---|---|---|
| Step 3 (ChromaDB up) | Yes | Network/container created + started, matches verbatim shape. |
| Step 4 (503 approve) | Shape yes, prose no | Stage markers + APPROVED outcome match; investigator/fixer/reviewer prose is longer/different (expected — page block is illustrative). |
| Step 5 (Kafka escalate) | Shape yes, one label gap | NO RUNBOOK FOUND / FIXER declines / REJECTED — escalate all matched; Triage line dropped the `AREA:`/`SEV:` labels the page's own expected block shows (Finding 2). |
| Step 6 (payments) | Shape and key details yes | AREA/SEV format correct this run; exact `kubectl rollout restart deploy/payments -n prod` command matched verbatim. |
| Step 7 (teardown) | Yes | Matches verbatim. |

## Seam m6→m7

Started cold from the stated environment: fresh repo clone present, Rancher Desktop running, native Ollama serving both required models, zero m7-specific containers running. The lab is self-contained — it does not require anything M6 built to still be running (M6's ChromaDB container, if left up, would conflict on port 8000, but M6's teardown presumably released it; not re-verified here since M6 was out of scope for this sweep). No port or volume collisions occurred: `chromadb` on 8000 and the `m7_default` network were created cleanly. The one pre-existing artifact (`m7_chroma_data` volume) is a same-module residue from a prior QA sweep, not an M6 leftover, and caused no functional problem — see machine-local observations above.

## Final machine state (post-teardown)

- **Containers:** none running for M7 (chromadb removed, crew ran with `--rm`). Unrelated pre-existing exited containers (`gracious_haibt`, `hub-dev-postgres`) untouched.
- **Networks:** `m7_default` removed. No M7 networks remain.
- **Volumes:** `m7_chroma_data` persists (by design — lab teardown never removes it; same pattern as M2–M6).
- **Images:** `acme-incident-crew:latest` (203MB, built during Step 4) and `chromadb/chroma:0.5.20` (676MB, pulled during Step 3) both remain cached locally — expected, matches "images from m2–m6 cached" pattern for future sweeps.
- **Ollama:** `qwen2.5:1.5b` and `nomic-embed-text` remain pulled; native server on :11434 untouched, still running.
- No course-related process left running; no hung containers; no leaked networks.
