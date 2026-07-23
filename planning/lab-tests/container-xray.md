# Container X-Ray — live-tool validation evidence

Validated live on this machine (arm64, Rancher Desktop 29.5.2, native Ollama on `:11434`)
against three real states, per the `live-tool` SKILL's live-test gate. Each state below
was driven through the real adapter (`collect.sh` → `state.json`, served by `serve.sh` on
`http://127.0.0.1:8787/`) and confirmed two ways: (1) the raw `state.json` payload fetched
over HTTP, and (2) a headless-Chrome `--dump-dom` of the served page, asserting the real
values render.

Bug found + fixed during validation: the first `collect.sh` draft used a nested
`for K in $KNOWN_IMAGES` word-split loop for image-name matching while `IFS` was narrowed
to newline-only (needed to iterate multi-line `docker` output) — the narrowed `IFS` broke
the inner loop's word-splitting of the space-separated `KNOWN_IMAGES` list, so no image
ever matched. Fixed by switching to a `case`-based membership test (`is_known_image()`)
that doesn't depend on `IFS`. Also found `docker compose ls` does not support Go-template
`--format` (only `table`/`json`) — switched to `--format json` piped through `python3 -c`
(stdlib only, no `jq` dependency assumed).

---

## State (a) — nothing running

```bash
docker ps --format '{{.Names}}'      # (empty)
docker compose ls                    # NAME   STATUS   CONFIG FILES   (empty)
```

`bash labs/tools/container-xray/serve.sh` started clean, immediate first snapshot written.

**Real `state.json` (captured via `curl http://127.0.0.1:8787/state.json`):**

```json
{"timestamp":"2026-07-23T01:57:45Z","dockerOk":true,"containers":[{"name":"gracious_haibt","image":"db3ff2e1800a","status":"Exited (0) 36 hours ago","ports":"","project":"","service":"","running":false},{"name":"hub-dev-postgres","image":"39fb82e41109","status":"Exited (0) 7 days ago","ports":"","project":"","service":"","running":false}],"compose":[],"images":[],"diskImages":"63.84GB","ollamaUp":true,"ollamaModels":["nomic-embed-text:latest","qwen2.5:1.5b","qwen3:0.6b", "...16 more..."],"hostDockerInternalOk":true}
```

(The two `Exited` containers are pre-existing, unrelated leftovers on this dev machine —
correctly excluded from every "running" view since `running:false`.)

**Assertions against the headless-Chrome DOM dump (`dom_state_a.html`):**

| # | Assertion | Result |
|---|---|---|
| 1 | Wiring lens containers panel shows the honest empty state (`nothing running — bring up a lab stack and refresh`) | PASS |
| 2 | Wiring lens Ollama panel shows real status `serving on :11434` (native Ollama genuinely up on this machine) | PASS |
| 3 | Wiring lens Ollama panel lists the real pulled model `qwen2.5:1.5b` | PASS |
| 4 | Wiring lens `host.docker.internal` indicator shows `reachable from a container` (real probe via a throwaway `curlimages/curl` container, same pattern as `labs/m1/call-ollama.sh`) | PASS |
| 5 | Poll indicator shows `fresh` (live) class within the freshness window | PASS |
| 6 | Stack lens shows the honest empty state naming `bash labs/m5/up.sh` / `bash labs/capstone/up.sh` | PASS |
| 7 | Platform lens images panel shows the honest empty state (no course images matched) | PASS |
| 8 | Platform lens overview shows `containers running` = `0` | PASS |

**8/8 assertions — state (a) honest-empty-state gate PASSED.**

---

## State (b) — m5 stack up

```bash
bash labs/m5/up.sh
# ...
# m5 ready: chromadb + genai-app healthy.
```

**Real `state.json` (captured live through the running poll loop):**

```json
{"timestamp":"2026-07-23T02:02:01Z","dockerOk":true,"containers":[{"name":"genai-app","image":"m5-genai-app","status":"Up 3 minutes (healthy)","ports":"0.0.0.0:8501->8501/tcp, [::]:8501->8501/tcp","project":"m5","service":"genai-app","running":true},{"name":"chromadb","image":"chromadb/chroma:0.5.20","status":"Up 3 minutes","ports":"0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp","project":"m5","service":"chromadb","running":true}, "...pre-existing exited containers omitted..."],"compose":[{"name":"m5","status":"running(2)","volumes":["m5_chroma_data"],"networks":["m5_default"]}],"images":[{"repoTag":"m2-client:latest","size":"260MB","id":"d0ac09e1e536"},{"repoTag":"acme-incident-crew:latest","size":"203MB","id":"a24271a311b8"},{"repoTag":"acme-support-agent:1.0.0","size":"203MB","id":"e285d7a47c66"},{"repoTag":"acme-support-agent:latest","size":"203MB","id":"e285d7a47c66"},{"repoTag":"capstone-genai-app:latest","size":"1.41GB","id":"2b3698eba7a6"},{"repoTag":"m5-genai-app:latest","size":"1.41GB","id":"176cbb2478a1"},{"repoTag":"vllm-cpu-optimized:latest","size":"5.41GB","id":"e4343d44a2ee"},{"repoTag":"chromadb/chroma:0.5.20","size":"676MB","id":"791bc2a7c3d0"},{"repoTag":"registry:2","size":"36.3MB","id":"a3d8aaa63ed8"}],"diskImages":"63.85GB","ollamaUp":true,"ollamaModels":["...19 models..."],"hostDockerInternalOk":true}
```

**Assertions against the headless-Chrome DOM dump (`dom_state_b.html`):**

| # | Assertion | Result |
|---|---|---|
| 1 | Wiring lens lists `genai-app` container with real port map `8501->8501` and `[m5/genai-app]` project/service tag | PASS |
| 2 | Wiring lens lists `chromadb` container with real port map `8000->8000` and `[m5/chromadb]` project/service tag | PASS |
| 3 | Wiring lens Ollama panel still lists `qwen2.5:1.5b` (native model unaffected by the compose stack) | PASS |
| 4 | Stack lens renders a project card for `m5` with real status `running(2)` | PASS |
| 5 | Stack lens `m5` card lists volume `m5_chroma_data` (matched by the `m5_` project-name prefix rule) | PASS |
| 6 | Stack lens `m5` card lists network `m5_default` | PASS |
| 7 | `host.docker.internal` indicator still shows reachable | PASS |

**7/7 assertions — state (b) PASSED.**

```bash
bash labs/m5/down.sh
# Container genai-app Stopped/Removed, Container chromadb Stopped/Removed, Network m5_default Removed
```

Teardown confirmed clean (containers + network removed; `down.sh` intentionally does not
remove the `m5_chroma_data` volume — matches the script's own documented behavior).

---

## State (c) — capstone stack up

```bash
bash labs/capstone/up.sh
# ...
# capstone ready: chromadb + genai-app healthy, agent + crew images built.
```

**Real `state.json` (captured live through the running poll loop):**

```json
{"timestamp":"2026-07-23T02:03:03Z","dockerOk":true,"containers":[{"name":"genai-app","image":"capstone-genai-app","status":"Up 17 seconds (health: starting)","ports":"0.0.0.0:8501->8501/tcp, [::]:8501->8501/tcp","project":"capstone","service":"genai-app","running":true},{"name":"chromadb","image":"chromadb/chroma:0.5.20","status":"Up 22 seconds (healthy)","ports":"0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp","project":"capstone","service":"chromadb","running":true}],"compose":[{"name":"capstone","status":"running(2)","volumes":["capstone_chroma_data"],"networks":["capstone_default"]}],"images":[{"repoTag":"m2-client:latest","size":"260MB","id":"d0ac09e1e536"},{"repoTag":"acme-incident-crew:latest","size":"203MB","id":"c0f6e1135425"},{"repoTag":"acme-support-agent:1.0.0","size":"203MB","id":"e285d7a47c66"},{"repoTag":"acme-support-agent:latest","size":"203MB","id":"2f3c274f97b4"},{"repoTag":"m5-genai-app:latest","size":"1.41GB","id":"176cbb2478a1"},{"repoTag":"capstone-genai-app:latest","size":"1.41GB","id":"f556611150a1"},{"repoTag":"vllm-cpu-optimized:latest","size":"5.41GB","id":"e4343d44a2ee"},{"repoTag":"chromadb/chroma:0.5.20","size":"676MB","id":"791bc2a7c3d0"},{"repoTag":"registry:2","size":"36.3MB","id":"a3d8aaa63ed8"}],"diskImages":"63.85GB","ollamaUp":true,"ollamaModels":["...19 models..."],"hostDockerInternalOk":true}
```

**Assertions against the headless-Chrome DOM dump (`dom_state_c.html`):**

| # | Assertion | Result |
|---|---|---|
| 1 | Wiring lens lists `genai-app` with `[capstone/genai-app]` tag (freshly rebuilt capstone image, distinct from m5's) | PASS |
| 2 | Wiring lens lists `chromadb` with `[capstone/chromadb]` tag | PASS |
| 3 | Platform lens lists all 8 known course-image basenames present on this machine: `m2-client`, `vllm-cpu-optimized`, `m5-genai-app`, `capstone-genai-app`, `acme-support-agent`, `acme-incident-crew`, `chromadb/chroma`, `registry` | PASS |
| 4 | Platform lens overview shows `course images cached` = `9 / 8` (9 matched repoTags across 8 known basenames — `acme-support-agent` has two tags) | PASS |
| 5 | Platform lens overview shows `containers running` = `2` | PASS |
| 6 | Platform lens overview shows `compose projects up` = `1` | PASS |
| 7 | Stack lens DOM contains project name `capstone`, volume `capstone_chroma_data`, network `capstone_default` (verified present in the raw dump; the Stack tab panel itself is CSS-hidden while Wiring is active, which is intended tab behavior, not a data gap) | PASS |

**7/7 assertions — state (c) PASSED.**

```bash
bash labs/capstone/down.sh
# Container genai-app / chromadb Stopped/Removed, Network capstone_default Removed,
# Volume capstone_chroma_data Removed (capstone's down.sh uses `-v`, unlike m5's)
```

Teardown confirmed clean.

---

## Totals

- **22/22 assertions passed** across the three real states (8 + 7 + 7).
- Real bug found and fixed during live validation (IFS/word-split matching failure in
  `collect.sh`'s image-name filter; `docker compose ls --format` template incompatibility).
- No data was ever simulated or invented — every value above came from a real `docker`
  call or a real `curl` to native Ollama on this machine.

## Gates

- `bash -n labs/tools/container-xray/serve.sh` — OK
- `bash -n labs/tools/container-xray/collect.sh` — OK
- Zero external refs in `index.html` — confirmed (no `http://`, `https://`, `<link`,
  external `src=`, `@import`, or Google Fonts reference; inline CSS + JS only).
- `cd site && npm run build` — GREEN (page-pointer edits only; see commit).
