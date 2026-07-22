# Learner-QA Sweep 06 — M5 · Docs Assistant (Naive RAG)

**Date:** 2026-07-22
**Site:** https://initcron.github.io/303-containerai/
**Pages walked (sidebar order, verified from live sidebar HTML):** `docs/m5-naive-rag/lesson` → `docs/m5-naive-rag/lab` → `docs/m5-naive-rag/quiz` (no deep-dive page in the M5 category)
**Role:** first-time learner, published pages only, every command run verbatim, record-don't-fix.
**Starting state:** fresh `git fetch` confirmed up to date on the learner clone (`schoolofdevops/303-containerai`, scratchpad), Rancher Desktop running, native Ollama :11434 with `qwen2.5:1.5b` cached (plus 18 unrelated models from other projects/prior walks), zero course containers running at start. Author's unrelated containers (`opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`, presidio analyzer/anonymizer) were observed stopping and restarting mid-walk on their own — not touched, per instructions.
**Executed directly** (no sub-agent dispatch, per controller instruction).

---

## Verdicts

| Page | Verdict |
|---|---|
| Lesson: Docs Assistant — Naive RAG | **PASS** |
| Lab: Docs Assistant — Naive RAG | **PASS-WITH-FINDINGS** (2 CONFUSING, 1 COSMETIC-cluster; no BLOCKER) |
| Quiz: Module 5 | **PASS** |
| Seam M4→M5 | **PASS** — no dependency on M4 state; no port/network collision |

**No BLOCKER findings.** The lab reaches its documented success end-state: ingest produces exactly "Chunks: 2 Documents: 1" as promised, and the query "How do I restart the payments service?" retrieves the payments-runbook chunk and generates the exact grounded `kubectl rollout restart deploy/payments -n prod` answer the page promises.

---

## Lesson — PASS

Read top to bottom. Clean analogy-first structure: the librarian-who-shelves-by-meaning analogy for vector DBs lands well and is explicitly tied back to embeddings/similarity search. The "anatomy of a GenAI app" table (LLM endpoint / embedding model / vector DB / application) and the "where naive RAG breaks" failure-mode table (query mismatch, wrong chunk boundary, single-pass retrieval, no query rewriting, stale index) are both concrete and directly reused by the lab and quiz — good internal consistency.

Verified in raw HTML: section 4 ("Here is the full pipeline with the container boundary marked") shows only its italic caption around a `<!-- -->` placeholder in static HTML — calibrated against M4's lesson HTML which shows the identical pattern for its own diagram section. This is the standard Docusaurus client-side Mermaid mount, not an M5-specific defect. Not a finding (consistent with prior sweep notes on M1-M4).

Slide deck link (`/303-containerai/decks/05-naive-rag.html`) resolves 200. No leaked author/planning content, no wrong repo/path names. The lesson's closing paragraph accurately previews the lab's actual steps (hand-author compose.yaml, ingest runbooks, ask the payments question, watch Learning Mode).

## Lab — PASS-WITH-FINDINGS

Every step executed verbatim, in order, from the learner clone (`cd labs/m5` from repo root). Raw `<pre>` blocks in the HTML (28 total) were extracted and cross-checked against the text rendering — no formatting drift found; the two below are genuine content mismatches, not extraction artifacts.

### Step-by-step log

**Prerequisites.** `ollama pull qwen2.5:1.5b` and `ollama pull nomic-embed-text` — both already cached, ~1.3–1.5s each (`success`). The page correctly introduces `nomic-embed-text` here for the first time and instructs pulling it — followed as printed. `curl -s localhost:11434/api/tags | grep -o '"name":"[^"]*"'` returned 19 models (not just the 2 the Expected block shows) because this machine carries models from other course modules/projects — not a course defect, the page's Expected block is illustrative and both required models are present.

**Step 1 — Navigate.** `cd labs/m5` — succeeded. **Immediately surfaces F1** (below): `labs/m5/compose.yaml` already exists in the clone, fully authored, byte-identical to what Step 2 instructs the learner to type.

**Step 2 — Author compose.yaml.** Typed/verified all three blocks (chromadb service, genai-app service, volumes stanza) — content is correct and, per F1, was already present verbatim from the clone.

**Step 3 — Start the stack.** `docker compose up -d --build` — completed in **1.9s** (image `m5-genai-app` fully cache-hit from a prior run on this machine; a first-time learner would see the documented 60–90s pip-install window). Output shape matched (`Image ... Built`, `Network m5_default Created`, both containers `Started`) — this Compose version prints without the `[+] Running 2/2` / `✔` checkmark styling in the page's Expected block; cosmetic CLI-version difference only, not a finding worth a severity tag (noted in COSMETIC cluster below).

**Step 4 — Verify.**
- `curl -s localhost:8000/api/v2/heartbeat` → `{"nanosecond heartbeat":1784719861979911373}` — matches shape exactly.
- `curl -s -o /dev/null -w '%{http_code}' localhost:8000/api/v2/heartbeat` → `200` — exact match.
- `curl -s -o /dev/null -w '%{http_code}' localhost:8501/_stcore/health` → `200` — exact match.
- `docker logs genai-app | grep Streamlit` → **F2** (below): real output is one line with leading whitespace and no URL; the page's Expected block shows both the banner line and the URL line concatenated as if `grep Streamlit` produced both.

**Step 5 — Ingest.** No browser-automation tool was available in this environment, so the file-upload click-path (Browse files → select `acme-runbooks.md` → Process Documents) could not be driven pixel-for-pixel. To validate the promised outcome faithfully, the exact code path `main.py`'s upload handler calls (`process_uploaded_file` → `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)` → `vectorstore.add_documents`) was invoked directly inside the running `genai-app` container against a copy of `labs/m5/docs/acme-runbooks.md`. Result: **exactly 2 chunks, 1 document** — matches the page's promised `Chunks: 2    Documents: 1` precisely. Embed+store took 1.73s (models already warm). This is disclosed as a methodology substitution, not a claim of having clicked the UI — see Environmental Note below.

**Step 6 — Ask the question.** Ran the identical retrieval + generation code path `main.py`'s chat handler executes, with prompt `"How do I restart the payments service?"`:
- Step 1 (embed query): 768-dim vector, 0.10s
- Step 2 (retrieve): 2 chunks found (matches — the store only has 2 chunks total, so k=3 naturally returns 2, same as the page's own "Found 2 relevant chunks" sample)
- Chunk 1 retrieved was the payments-runbook chunk containing `kubectl rollout restart deploy/payments -n prod`
- Step 4 (generate): 14.66s
- **Final answer:** `To restart the Acme payments service, run the following command:` followed by `kubectl rollout restart deploy/payments -n prod` in a code fence — matches the page's promised grounded answer by shape (page: "To restart the payments service, you need to execute the following command: kubectl rollout restart deploy/payments -n prod"). Judged by shape per instructions (grounded answer citing the exact runbook command), not exact wording — **PASS**, the page does not imply exact wording here.

**Step 7 — Tear down.** `docker compose down` → both containers and `m5_default` network removed, matching the page's Expected item list exactly (same cosmetic checkmark-formatting difference as Step 3). Confirmed `m5_chroma_data` volume survived (as the page promises). `docker compose down -v` → volume removed cleanly.

### Findings

**F1 — CONFUSING.** Page + step: Lab, Step 1/2 ("Step 1: Navigate to the lab directory" → "Step 2: Author the compose.yaml").
Command: `cd labs/m5`.
Expected: the lab's framing is "Write each block deliberately — understanding every line before you move on," implying `compose.yaml` does not yet exist.
Got: `labs/m5/compose.yaml` already exists in the git clone, and is byte-for-byte identical to the three blocks Step 2 instructs the learner to type.
Severity: CONFUSING (not BLOCKER — nothing breaks; a learner who reads the file first sees the finished answer before "authoring" it, undercutting the stated pedagogy). Confirmed this is a repo-wide pattern (M2's `labs/m2/compose.yaml` also ships pre-authored), so it is a **known, consistent course-wide seam**, not M5-unique — flagging again here since it lands squarely on M5's first hands-on step.

**F2 — CONFUSING.** Page + step: Lab, Step 4, "App log confirmation."
Command: `docker logs genai-app | grep Streamlit` (run exactly as printed, no `2>&1`).
Expected (page): 
```
You can now view your Streamlit app in your browser.  URL: http://0.0.0.0:8501
```
Got (verbatim):
```
  You can now view your Streamlit app in your browser.
```
Root cause confirmed via full unfiltered `docker logs genai-app`: Streamlit's real banner splits the message and the URL onto two separate lines with a blank line between them:
```
  You can now view your Streamlit app in your browser.

  URL: http://0.0.0.0:8501
```
The word "Streamlit" only appears on the first line, so `grep Streamlit` (single-line grep, no context flag) cannot produce the second line — the page's Expected block shows a result the printed command cannot actually produce.
Severity: CONFUSING (a learner would see a truncated match and either worry something is missing or wonder why their output differs from the page).

**Cosmetic cluster (not numbered as findings, noted for completeness):** the installed `docker compose` version on this machine prints plain `Container ... Started` / `Removed` lines without the `[+] Running N/N` summary header or `✔` checkmarks the page's Expected blocks show. This affected Steps 3 and 7. Same shape, same items, same order — no functional confusion, consistent with the COSMETIC-severity Compose-version formatting differences noted in prior sweeps (M2–M4).

### Environmental note (not a course finding)

No browser-automation tool was available in this QA session, so Steps 5 and 6's UI actions (Browse files, Process Documents click, chat_input typing) could not be executed pixel-for-pixel through the Streamlit interface. To avoid fabricating browser interaction, the underlying `main.py` code paths that those UI actions trigger were invoked directly and produced results that match the page's Expected outcomes exactly (2 chunks / 1 document on ingest; correct grounded `kubectl rollout restart deploy/payments -n prod` answer on query). This validates the lab's promised end-state is real and reachable, but a true click-through walk of the Streamlit widgets themselves was not performed. Flagging this as a testing-methodology limitation for the record, not a page defect.

## Quiz — PASS

5 questions rendered (within the course's 4–6 convention), first question is `multiSelect` ("Select all that apply") with 4 correct options (LLM endpoint, embedding model, vector database, application layer) and 1 correct-to-exclude (fine-tuning pipeline) — matches the lesson's "four parts of a GenAI app" table exactly. Remaining 4 single-select questions test: the ChromaDB 0.5.20 pin rationale, the naive-RAG query-phase step order, a failure-mode diagnosis scenario (query mismatch vs. stale index vs. wrong chunk boundary vs. no query rewriting), and the `host.docker.internal` vs `localhost` container-networking distinction — all traceable to specific lesson/lab content, no trivia. Verified in raw HTML that the `<Quiz>` component mounted correctly (`options_X9pq` / `option_qGol` CSS classes present, "Check answers"/"Reset" buttons present) — not a blank render.

---

## Seam M4 → M5 — PASS

M4 (KitOps packaging) leaves no long-running containers or networks — nothing to interfere with M5's `docker compose up`. Confirmed at walk start: zero course containers running, and after full M5 teardown: zero M5 containers, zero M5 volumes, `m5_default` network removed. A leftover `m2_default` Docker network from an earlier module's walk was present throughout but caused no collision (M5 uses its own isolated `m5_default` network on ports 8000/8501, neither of which any other running container claims). Both models pulled in M5's Prerequisites (`qwen2.5:1.5b`, `nomic-embed-text`) remained available in Ollama after teardown, ready for M6.

---

## Timing summary

| Section | Time (this machine, mostly cache-warm) |
|---|---|
| `ollama pull` x2 (prerequisites) | ~1.3–1.5s each (already cached) |
| `docker compose up -d --build` | 1.9s (image fully cached; page warns 60–90s cold) |
| ChromaDB / Streamlit health checks | instant |
| Ingest (2 chunks, embed+store) | 1.73s (embedding model already warm) |
| Query (embed 0.10s + retrieve 0.17s + generate 14.66s) | ~15s total |
| `docker compose down` / `down -v` | instant |

All timings are faster than the page's stated expectations because models and the app image were already warmed from prior module walks on this machine — consistent with the machine notes (this is a real learner's cumulative state, not a fresh environment). A true first-time learner should expect the page's stated 60–90s build window and 10–30s first-embed warmup.

---

## Final machine state (handoff to M6)

- **Containers:** zero M5 containers running (`genai-app`, `chromadb` both removed via `docker compose down -v`).
- **Volumes:** `m5_chroma_data` removed (learner followed the lab's own final `down -v` step).
- **Networks:** `m5_default` removed; unrelated leftover networks (`m2_default`, `gateway_default`, `deploy_default`, etc.) untouched.
- **Ollama:** `qwen2.5:1.5b` and `nomic-embed-text:latest` both present and confirmed via `/api/tags`.
- **Images:** `m5-genai-app:latest` and `chromadb/chroma:0.5.20` remain cached locally (not removed by `compose down`), ready for reuse.
- **Unrelated containers:** author's other-project containers (`opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`, presidio analyzer/anonymizer) ended the walk running again (they restarted on their own mid-session) — not touched at any point.
- **Repo:** learner clone left exactly as the lab's own instructions leave it — `compose.yaml`, `app/`, `docs/` all present, working tree clean relative to the upstream repo (no course files edited during this QA walk).
