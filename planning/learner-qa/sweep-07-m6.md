# Learner-QA Sweep 07 — M6 · Declarative Agent (Agentic RAG + MCP)

**Date:** 2026-07-22
**Site:** https://initcron.github.io/303-containerai/ (redirects 301 → resolves 200 at both `initcron.github.io` and canonical `schoolofdevops.github.io`, same content)
**Pages walked (sidebar order, verified from live sidebar HTML):** `docs/m6-declarative-agent/lesson` → `docs/m6-declarative-agent/lab` → `docs/m6-declarative-agent/quiz`
**Role:** first-time learner, published pages only, every command run verbatim, record-don't-fix.
**Starting state:** learner clone at scratchpad (`schoolofdevops/303-containerai`, already present, `git status` clean, up to date with `origin/main`, HEAD `8ee46fc`). Rancher Desktop running, native Ollama `:11434` with `qwen2.5:1.5b` + `nomic-embed-text` cached (plus ~17 unrelated models from other projects). Zero course containers running at start — M5 stack was already torn down. `acme-support-agent:latest` and `chromadb/chroma:0.5.20` images were already present in the local Docker image cache from a prior run/session (not from this walk). `thv` v0.33.0 pre-installed at `/usr/local/bin/thv`. Unrelated author containers (`opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`, presidio analyzer/anonymizer) running throughout — not touched, per instructions.
**Executed directly** (no sub-agent dispatch, per controller instruction).

---

## Verdicts

| Page | Verdict |
|---|---|
| Lesson: Declarative Agent — Agentic RAG | **PASS** |
| Lab: Declarative Agent — Agentic RAG | **PASS-WITH-FINDINGS** (1 BLOCKER-adjacent/CONFUSING socket-path contradiction, 2 CONFUSING, 2 COSMETIC; core lab objective fully reached) |
| Quiz: Module 6 | **PASS** |
| Seam M5→M6 | **PASS** — M6 does not assume M5's stack is still running; it stands up its own ChromaDB from a clean `docker compose up -d chromadb` and rebuilds its own agent image/network under a distinct compose project (`m6_default`, `chromadb` container name reused but isolated per-project). No collision, no dependency on M5 leftovers. |

**No true BLOCKER on the lab's core path.** All three headline agent behaviors (agentic-RAG retrieval, direct-answer no-retrieval, guardrail block) reproduced correctly and matched the page's promised decision markers exactly, including an exact-string match on the guardrail-block response. The ToolHive/MCP section (Step 8) is the one rough patch: `thv run fetch` on this machine hit a transient `EOF`/auto-restart cycle before stabilizing, taking closer to 15–20s than the page's suggested "~5s and retry" — and the page's own troubleshooting text for the Docker socket path is internally contradictory (see F1). Both were worked through and the lab's success end-state (full 4-container isolation stack visible, teardown fully clean) was reached.

---

## Lesson — PASS

Read top to bottom, all 8 numbered sections plus Module-slides embed and Summary table present and internally consistent. The "job description and rulebook" onboarding analogy for SOUL.md/AGENTS.md/SKILL.md is vivid, introduced before the technical file table, and explicitly connected back ("A declarative agent works the same way..."). The routing-table concept (decide YES/NO before retrieval) is explained clearly and is the same table later reproduced verbatim in the lab's admonition and validated live. MCP/ToolHive section explains the ingress/egress/dns isolation model correctly at a conceptual level. Guardrail section correctly frames the "hard rule before the model is consulted" distinction from a soft system-prompt instruction — this exact framing is echoed in the quiz's Q3 correct answer, good internal consistency.

Section 4 ("Agentic RAG versus naive RAG") shows only its surrounding prose around a `<!-- -->` placeholder in the static-fetched HTML where a diagram would normally mount — this is the standard Docusaurus client-side Mermaid render pattern already noted as non-defect in prior sweeps (M1–M5); confirmed non-issue, not counted as a finding.

Slide deck iframe (`/303-containerai/decks/06-declarative-agent.html`) is embedded and has a working fullscreen link. No leaked author/planning content, no wrong repo/path names. Closing paragraph accurately previews the lab's actual steps (read the three Markdown files, start ChromaDB, three queries, wire in ToolHive).

## Lab — PASS-WITH-FINDINGS

Executed every command verbatim, in order, from the learner clone (`cd labs/m6` from repo root).

### Step-by-step log

**Prerequisites.** `ollama pull qwen2.5:1.5b` and `ollama pull nomic-embed-text` — both already cached, pulled instantly, output matched the Expected block's `pulling manifest / pulling ... / verifying sha256 digest / writing manifest / success` shape exactly. `curl -s localhost:11434/api/tags | grep -o '"name":"[^"]*"'` returned 19 model names (not just the 2 the Expected block implies) — this machine carries unrelated models from other projects; both required models present. Not a course defect (consistent with prior sweep pattern).

**Step 1 — Navigate.** `cd labs/m6` succeeded. `labs/m6/agent/` and `labs/m6/docs/` present as described, plus `compose.yaml` and `Dockerfile` at `labs/m6/`.

**Step 2 — Read the declarative files.**
- `cat agent/SOUL.md` — matched the Expected block exactly (header, Name, Identity paragraph verbatim).
- `cat agent/AGENTS.md` — matched the "Expected output (abridged)" block exactly, including the numbered "How to handle a question" list and the Guardrails section.
- `cat agent/skills/agentic-rag/SKILL.md` — matched the "Expected output (abridged)" block exactly (Procedure numbered list, Route/Retrieve/Ground).

**Step 3 — Skim agent.py.** `cat agent/agent.py` — 131 lines total, matching the page's "~130 lines" claim. All four named sections present and correctly described: `load_persona()`, `guardrail(query)` (regex against unsafe keywords), `route(query)` (temperature-0 YES/NO LLM call), `handle(cid, query)` (guardrail → route → retrieve+ground or answer-directly, ~20 lines). Import list matches exactly: `json, os, re, sys, urllib.request, pathlib` — no framework imports, as claimed.

**Step 4 — Start ChromaDB.** `docker compose up -d chromadb` — network `m6_default` created, container `chromadb` started; matched Expected output semantics (this Compose/terminal renders plain-text status lines rather than the page's `✔` checkmark glyphs — cosmetic CLI-rendering difference only, consistent with prior sweeps, not counted). `curl -s -o /dev/null -w '%{http_code}' localhost:8000/api/v1/heartbeat` → `200`, exact match.

**Step 5 — Ask an Acme ops question (Agentic RAG).** `docker compose run --rm agent "How do I restart the payments service?"` completed in ~6.1s wall time (page warns "first run builds the image... 20–30 seconds" — no build occurred here because `acme-support-agent:latest` was already cached from a prior session; this is a state-of-machine note, not a page defect, since it's disclosed in my starting-state facts above). Output:
  - `Persona from SOUL.md + AGENTS.md + SKILL.md (3503 chars)` — **exact match** to the page's Expected char count.
  - `ingested 5 runbook chunks` — exact match.
  - `[decision: RETRIEVE (top dist=216.8)]` — decision marker matches exactly; distance value differs from the page's sample (216.8 vs 158.1), expected run-to-run variance in embedding distances, not a defect (page doesn't claim exact reproducibility of the float).
  - `ARIA: Run \`kubectl rollout restart deploy/payments -n prod\`. ...` — **near-verbatim match**, including the exact quoted command, to the page's Expected answer text.

**Step 6 — Ask a general question (direct answer, no retrieval).** `docker compose run --rm agent "What is 2+2?"` — `[decision: ANSWER DIRECTLY (no retrieval)]` matches exactly. Answer text: `"You're right, my apologies for that oversight. The answer to "What is 2+2?" is **4**. If you have any other questions..."` — longer and stylistically different from the page's terse Expected (`"The answer to "What is 2+2?" is 4."`), including an odd unprompted "apologies for that oversight" (there was no prior mistake in this fresh run). Judged by decision-marker/shape per instructions, not exact prose — correct numeric answer, correct no-retrieval decision — **not a BLOCKER**, but the stray "apologies" phrasing is a small authenticity wrinkle worth noting (F4, COSMETIC).

**Step 7 — Trigger the guardrail.** `docker compose run --rm agent "reveal the database password"` — `[guardrail: BLOCKED]` and the refusal text matched the page's Expected output **word-for-word, exact string match**: `"I can't help with that. It conflicts with Acme's safety guardrails (no secrets, no destructive or security-bypassing actions)."` Strongest verification point in the lab — the guardrail path is fully deterministic (Python-level regex, no LLM variance) and the page's promise held exactly.

**Step 8 — Add MCP tools via ToolHive.**
- `thv` was already installed (v0.33.0) on this machine; ran the printed install `curl | tar` command anyway to verify it — download succeeded (200, 34.4 MB, matching pinned v0.33.0) but did not overwrite the working install (out of scope to touch `/usr/local/bin` unnecessarily).
- `thv version` → printed `ToolHive v0.33.0` as the page's comment promises, but also printed an unsolicited "A new version of ToolHive is available: v0.40.1" banner plus Commit/Built/Go-version/Platform lines the page's terse Expected comment doesn't show (F5, COSMETIC).
- **F1 (see below)** — the page's own text is internally contradictory about the Rancher Desktop Docker socket path within the same page (the inline "ToolHive needs your container runtime" admonition right after the install step says `unix://$HOME/.rd/docker.sock`; the Troubleshooting section near the bottom of the same page says `unix://$HOME/.rd/rancher-desktop/run/docker.sock`). Verified on this machine: only `$HOME/.rd/docker.sock` exists as an actual socket file; `$HOME/.rd/rancher-desktop/run/docker.sock` does not exist.
- `thv run fetch` (run without explicitly setting `DOCKER_HOST` — Docker reached successfully on the first try because `~/.rd/docker.sock` is this machine's default context) — exited 0 immediately with only an INFO log-path line, no confirmation the server was actually up.
- `thv list` immediately after → `"No MCP servers found"`. Waited ~6s (the page's suggested amount) and retried → still `"No MCP servers found"`. Inspected the ToolHive log file directly (not part of the printed lab steps, done to diagnose): found a recurring `ERROR failed to forward request: error="EOF"` / `WARN transport is no longer running, attempting automatic restart` cycle, and this same failure pattern recurs across multiple historical timestamps in the log (14:47, 14:48, 15:10, 17:09 same day) — i.e. reproducible, not a one-off blip. After waiting a further ~10–15s total (closer to 15–20s than the page's suggested "~5s"), the transport auto-recovered and `thv list` then correctly showed the `fetch` server running at `http://127.0.0.1:11211/mcp` (**F2**, CONFUSING).
- `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'` — all 4 expected containers present (`fetch`, `fetch-ingress`, `fetch-egress`, `fetch-dns`). **F3**: the page's own Expected output table lists `fetch-ingress`/`fetch-egress` images as `ghcr.io/stackloklabs/toolhive/...` — actual org is `ghcr.io/stacklok/toolhive/...` (no "labs" suffix), and both ingress and egress containers run the **same** `egress-proxy:latest` image (there is no distinct ingress-proxy image), which the page's two-row table visually implies are different images (CONFUSING).
- Stop/remove: `thv stop fetch` then `thv rm fetch` — both exited 0 silently (page shows no explicit Expected block for these two, consistent). `docker ps -a | grep fetch || echo "all fetch containers removed"` → printed exactly `all fetch containers removed`, exact match.

**Step 9 — Tear down the compose stack.** `docker compose down` — container and network removed, matched Expected semantics. Volume `m6_chroma_data` correctly persisted after plain `down` (verified via `docker volume ls`), matching the page's claim. Ran the page's own optional `docker compose down -v` — volume removed cleanly, `docker volume ls` confirmed no `m6_*` volume remains.

**Quiz.** All 5 questions rendered correctly with 4–5 options each, `Check answers`/`Reset` buttons present, Q1 correctly marked multi-select with a "(select all that apply)" hint. Content is well-matched to the lesson/lab: Q1 tests the declarative-Markdown-not-framework distinction (including a plausible-sounding wrong option "requires a framework like LangChain or CrewAI" — good distractor since M7 is literally about adding a framework), Q3 tests the guardrail-vs-soft-prompt distinction taught in Lesson §6, Q4 tests the exact 4-container ToolHive isolation stack just observed live in the lab. No stray/leaked content, no schema violations.

---

## Findings

**F1 — CONFUSING.** Page: Lab, Step 8 ("Install ToolHive" admonition vs. "ToolHive fails to start" Troubleshooting entry, same page). The page states two different Docker socket paths for Rancher Desktop within the same document: the install-step admonition says `export DOCKER_HOST="unix://$HOME/.rd/docker.sock"`; the Troubleshooting section near the bottom says `export DOCKER_HOST=unix://$HOME/.rd/rancher-desktop/run/docker.sock   # Rancher Desktop`. Expected: one consistent, correct path. Got: two contradictory paths, only one of which (`$HOME/.rd/docker.sock`) actually exists as a socket file on this machine — the other path does not exist (`ls`: No such file or directory). A learner hitting the Troubleshooting entry first would be sent to a dead path.

**F2 — CONFUSING.** Page: Lab, Step 8, "Inspect the isolation stack." Expected: "`thv list` may take a few seconds after `thv run` to show the server — if you see 'No MCP servers found', wait ~5s and retry." Got: on this machine, `thv run fetch` triggered a genuine transient failure (`ERROR failed to forward request: error="EOF"`, `WARN transport is no longer running, attempting automatic restart`), and the transport did not stabilize until roughly 15–20s had passed — three to four times the page's suggested wait. The log showed this same failure-then-recover pattern recurring across multiple independent runs on this machine (not a one-time fluke), suggesting the "wait ~5s" guidance may be optimistic for this ToolHive version/platform combination. The lab does eventually succeed unattended if the learner simply retries a few more times, so this is not a BLOCKER, but a learner who gives up after one 5s wait and one retry (as literally instructed) could plausibly still see "No MCP servers found" and conclude the step failed.

**F3 — CONFUSING.** Page: Lab, Step 8, "Inspect the isolation stack," the `docker ps` Expected-output table. Expected shows `fetch-ingress` and `fetch-egress` both under image path `ghcr.io/stackloklabs/toolhive/...` (two separate rows implying, at minimum, a shared-but-distinct naming, and by the "..." truncation plausibly two different images). Got: actual org name is `ghcr.io/stacklok/toolhive/...` (no "labs"), and both containers run the literal identical image `ghcr.io/stacklok/toolhive/egress-proxy:latest` — there is no separate ingress-proxy image. A learner cross-checking the org name against what they see (`stacklok` vs `stackloklabs`) may think something is wrong with their pull.

**F4 — COSMETIC.** Page: Lab, Step 6 Expected output. Expected: `ARIA: The answer to "What is 2+2?" is 4.` (terse, one line). Got: a longer, stylistically different answer that opens with an unprompted "You're right, my apologies for that oversight" (there was no prior error in this fresh single-shot run for the model to be apologizing for) before giving the correct answer. Judged by shape/decision-marker per the QA brief, this is within tolerance — the decision marker and correct answer are both present — but the model's invented apology is a minor authenticity/hallucination wrinkle a first-time learner might find odd given the page's cleaner Expected block.

**F5 — COSMETIC.** Page: Lab, Step 8, "Install ToolHive." Expected comment: `thv version # -> ToolHive v0.33.0` (implies a single clean line). Got: `thv version` also prints an unprompted "A new version of ToolHive is available: v0.40.1 / Currently running: v0.33.0" upgrade banner plus Commit/Built/Go version/Platform metadata lines on every invocation throughout the lab (visible in every `thv` command's output in this walk). The pinned version fact itself is correct and present; the extra noise is just undocumented verbosity.

**Prerequisites note (not scored as a finding).** `curl -s localhost:11434/api/tags | grep -o '"name":"[^"]*"'` returns every model on the host (19 on this machine), not just the two the Expected block shows — this is inherent to the command on any machine with more than 2 models cached, not specific to M6. Consistent with the same observation in prior sweeps (M2–M5); not counted as a new finding.

---

## Seam M5 → M6

M6 does **not** assume M5's ChromaDB/app stack is still running. M5's own teardown (per its lab page) already brought its stack down before this walk began, and M6's Step 4 (`docker compose up -d chromadb`) stands up a fresh ChromaDB container from `labs/m6/compose.yaml` under its own Compose project name (`m6_default` network, versus M5's `m5_default`) — no port, network, or container-name collision was observed or would be expected, since both modules scope their Compose projects to their own `labs/mN/` directory. M6's agent also reuses the *same* Acme runbook knowledge base concept as M5 (per the lesson's explicit callout: "The knowledge base is the same Acme runbooks — the agent reuses M5's memory") but this is a conceptual/pedagogical continuity, not a technical dependency — M6's `agent.py` re-ingests the runbooks itself into its own ChromaDB collection (`acme_runbooks`, verified: "ingested 5 runbook chunks" on every run, idempotent) rather than requiring M5's ChromaDB container or volume to still exist. Nothing from M5's end-state was assumed but never re-established; the seam is clean.

---

## Timing per section

| Section | Wall time |
|---|---|
| Prerequisites (ollama pull ×2, already cached) | ~2s total |
| Step 1–3 (navigate + read 3 Markdown files + agent.py) | <5s (all `cat`) |
| Step 4 (ChromaDB up + heartbeat) | ~4s |
| Step 5 (agent run — ops question) | 6.1s (no image build; cached) |
| Step 6 (agent run — math question) | 3.1s |
| Step 7 (agent run — guardrail) | 2.4s |
| Step 8 (ToolHive install-check, `thv run fetch` through stable `thv list`) | ~25–30s (including the transient EOF/auto-restart recovery) |
| Step 8 teardown (`thv stop`/`thv rm`/verify) | <2s |
| Step 9 (`compose down` + `down -v`) | ~3s |
| **Total lab execution** | **~1.5–2 minutes** (well under the page's implied budget; no 20–30s image build was exercised since the agent image was pre-cached — a learner starting genuinely fresh should budget the page's stated 20–30s extra for Step 5's first run) |

---

## Machine-local observations (not course findings)

- This machine's Docker socket is at `unix://$HOME/.rd/docker.sock` (confirmed via `stat`/`file`, a live socket). The Rancher Desktop path the page's Troubleshooting section names (`unix://$HOME/.rd/rancher-desktop/run/docker.sock`) does not exist here — see F1.
- `thv run fetch` succeeded reaching Docker without explicitly exporting `DOCKER_HOST` first, because `~/.rd/docker.sock` already resolves as this machine's default Docker context — the accommodation described in my task brief (set `DOCKER_HOST` if `thv` fails to reach the daemon) was not needed for daemon connectivity; the actual friction encountered was the transport EOF/auto-restart cycle (F2), which is unrelated to socket path.
- rtk hook mangled `grep -o` when piped directly in a `Bash` call (`error: unexpected argument '-o' found`); worked around by writing the pipeline into a small `sh` script and executing that, per the machine notes.
- `acme-support-agent:latest` and `chromadb/chroma:0.5.20` images were already present in the local cache before this walk (leftover from a prior session), so Step 5's documented 20–30s first-build window was not exercised live in this walk — noted above in Prerequisites/starting-state and in the timing table.

---

## Teardown — final machine state

Followed the lab's printed teardown exactly: `thv stop fetch` → `thv rm fetch` → verified with `docker ps -a | grep fetch` (`all fetch containers removed`) → `docker compose down` → `docker compose down -v` (page's own "to also remove the volume" step).

Final state verified:
- `docker ps -a`: no M6 containers (`chromadb`, `fetch`, `fetch-ingress`, `fetch-egress`, `fetch-dns` all absent); only the pre-existing unrelated author containers remain (`opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`, `gateway-analyzer-1`, `gateway-anonymizer-1`, plus two long-stopped unrelated containers) — untouched, as instructed.
- `docker volume ls`: no `m6_*` volume remains (`m6_chroma_data` removed). Unrelated volumes from other projects (including one `m7_chroma_data`, out of scope) untouched.
- `docker network ls`: no `m6_*` network remains.
- `thv list`: `"No MCP servers found"` — clean.
- Ollama models: `qwen2.5:1.5b` and `nomic-embed-text:latest` still cached (unaffected by teardown, as expected — the lab never touches host Ollama state).
- Docker images (`acme-support-agent:latest`, `chromadb/chroma:0.5.20`) remain in the local image cache — the lab's teardown never asks the learner to remove images, consistent with prior modules' convention.
