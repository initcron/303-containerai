# Lab-test evidence — Capstone: Ship the Acme AI Support Platform

**Machine:** Apple Silicon (arm64), 16 GB · Rancher Desktop · native Ollama
**Date:** 2026-07-05

The Capstone composes the pieces validated across M1–M8. `labs/capstone/platform-check.sh` verifies the
whole stack is in place on any OCI runtime, in one command:

```
$ ./platform-check.sh
== 1. Container runtime ==
  ✔ docker CLI + engine reachable
== 2. Model serving (native Ollama, OpenAI-compatible) ==
  ✔ Ollama serving on :11434
  ✔ chat model present (qwen2.5)
  ✔ embedding model present (nomic-embed-text)
== 3. Container → native model wiring ==
  ✔ containers reach the model via host.docker.internal
== 4. Packaging + supply chain tooling ==
  ✔ kit (KitOps) installed
  ✔ thv (ToolHive) installed
  ✔ syft / trivy / grype / cosign installed

PLATFORM READY — serve → RAG → agent → crew → package → secure → ship.
```

## End-to-end flow (each step validated in its module)

| Step | What | Validated in |
| --- | --- | --- |
| 1. Serve | native Ollama (`qwen2.5:1.5b`) behind OpenAI `/v1`; vLLM CPU option | M2, M3 (`lab-tests/m2,m3.md`) |
| 2. RAG | Docs Assistant over Acme runbooks (ChromaDB) | M5 (`lab-tests/m5.md`) |
| 3. Agent | declarative Agentic-RAG agent + guardrail + MCP (ToolHive) | M6 (`lab-tests/m6.md`) |
| 4. Crew | Incident Crew: triage→investigate→fix→review, approve/escalate | M7 (`lab-tests/m7.md`) |
| 5. Package | model + config as a ModelKit, push/pull (KitOps) | M4 (`lab-tests/m4.md`) |
| 6. Secure | SBOM + scan + sign + sandbox (Syft/Trivy/Grype/Cosign) | M8 (`lab-tests/m8.md`) |
| 7. Ship | GitHub Actions build→scan→sign (`labs/m8/security-pipeline.yml`) | M8 |
| 8. Portability | the same `compose.yaml`/commands run on Colima ↔ Rancher ↔ OrbStack ↔ Podman | M1 principle |

## Verdict

✅ Every layer of the Acme AI Support Platform is validated and wired on a 16 GB laptop, on the open OCI
stack — no paid Docker Desktop, model served natively, everything else containerized and portable.

---

## 2026-07-07 — Capstone rework validation (Issues 1 + 2)

**Machine:** Apple Silicon (arm64), 16 GB · Rancher Desktop 29.5.2 · native Ollama 0.17.4

### ISSUE 1 — Consolidated capstone compose.yaml

Created `labs/capstone/compose.yaml` with ONE shared ChromaDB (0.5.20) + M5 Docs Assistant + M6 agent + M7 crew. Healthcheck on chromadb uses python3 heartbeat poll.

```
$ cd labs/capstone
$ docker compose up -d chromadb genai-app
  Network capstone_default Created
  Volume capstone_chroma_data Created
  Container chromadb Started  (healthy, :8000 heartbeat 200)
  Container genai-app Started
```

ChromaDB heartbeat: `{"nanosecond heartbeat":1783408182919100952}` — 200 OK

Docs Assistant: `curl -so /dev/null -w "%{http_code}" http://localhost:8501/` → **200**

```
$ docker compose run --rm agent "how do I restart the payments service?"
[agent] Aria ready — ingested 5 runbook chunks. Persona from SOUL.md + AGENTS.md + SKILL.md (3503 chars).
USER: how do I restart the payments service?
  [decision: RETRIEVE (top dist=162.6)]
ARIA: Run `kubectl rollout restart deploy/payments -n prod`. ...
```

```
$ docker compose run --rm crew "P1: checkout 503"
[crew] Acme Incident Crew: Triage -> Investigator -> Fixer -> Reviewer
[TRIAGE]      AREA: checkout | SEV: critical | Checkout service unavailable.
[INVESTIGATOR] kubectl scale deploy/web --replicas=5 -n prod
[FIXER]       kubectl scale deploy/web --replicas=5 -n prod
[REVIEWER]    APPROVED — ready for a human to apply
```

Teardown: `docker compose down` — all containers and network removed cleanly.

### ISSUE 2 — secure-image.sh on local image

Fixed `labs/m8/secure-image.sh` to:
- Scan the LOCAL image with syft/trivy/grype (no registry pull)
- Sign via local `registry:2` at localhost:5001 with `--allow-http-registry`
- Print clear instructions for the optional GHCR push+sign step

```
$ cd labs/m8 && ./secure-image.sh acme-incident-crew:latest
==> [1/4] SBOM with syft  (local image — no registry pull)
    wrote sbom.spdx.json
==> [2/4] Vulnerability scan with trivy  (CRITICAL/HIGH — local image)
Total: ...
==> [3/4] Second opinion with grype  (local image)
Vulnerabilities by severity: Critical X, High X, ...
==> [4/4] Sign with cosign (key-based, via local registry)
The signatures were verified against the specified public key
Done. SBOM + scanned + signed acme-incident-crew:latest (signed ref: localhost:5001/acme-incident-crew:latest).
```

All four stages succeeded on the local `acme-incident-crew:latest` image with no GHCR pull.

### Docusaurus build

`npm --prefix site run build` → **SUCCESS** (no errors, no warnings)

`grep -nE '^:::(note|tip|info|warning|danger|caution) ' site/docs/capstone/index.md site/docs/m8-security/lab.md` → **0 matches** (all admonitions use bracket form)

## checks.json validation 2026-07-22

Authored `labs/capstone/checks.json` + `up.sh`/`down.sh` (m2/m3 pattern; teardown uses `down -v` since
the capstone demo should leave no volumes behind). Checks combine `platform-check.sh`'s readiness gate
with a live bring-up of every consolidated service and both one-shot runners.

```
$ ./labs/capstone/up.sh
 ... Image capstone-genai-app Built
 ... Container chromadb Healthy
 ... Container genai-app Started
 ... Image acme-support-agent:latest Built
 ... Image acme-incident-crew:latest Built
capstone ready: chromadb + genai-app healthy, agent + crew images built.

$ node scripts/run-checks.mjs labs/capstone/checks.json
✅ platform-check-ready — platform-check.sh confirms every layer (runtime, model serving, host wiring, supply-chain tooling) is present
✅ chromadb-healthy — shared ChromaDB answers the v2 heartbeat
✅ genai-app-healthy — Docs Assistant (Streamlit) exposed endpoint returns 200
✅ agent-grounded-answer — the one-shot support agent grounds its answer in the exact runbook command
✅ crew-approves-incident — the one-shot incident crew approves a runbook-backed incident end-to-end
✅ compose-teardown-with-volumes — compose down -v removes containers, network, and volumes cleanly

6/6 checks · score 6/6
```

Raw output backing the two application-level checks (fresh run on this validation pass):

```
$ docker compose run --rm agent 'how do I restart the payments service?'
[agent] Aria ready — ingested 5 runbook chunks (collection 42d13825). Persona from SOUL.md + AGENTS.md + SKILL.md (3503 chars).
USER: how do I restart the payments service?
  [decision: RETRIEVE (top dist=216.8)]
ARIA: Run `kubectl rollout restart deploy/payments -n prod`. ...

$ docker compose run --rm crew 'P1: checkout 503'
[TRIAGE]       AREA: checkout | SEV: critical | Checkout service unavailable.
[INVESTIGATOR] ## Checkout 503 errors ...
[FIXER]        kubectl scale deploy/web --replicas=5 -n prod
[REVIEWER]     APPROVED: ...
OUTCOME: APPROVED — ready for a human to apply
```

Post-teardown check: `docker ps -a` and `docker volume ls` confirmed no `chromadb`/`genai-app`/
`agent`/`crew` containers or `capstone_chroma_data` volume remained.

No lab drift found — `compose.yaml` and `platform-check.sh` matched the earlier consolidated-stack
validation exactly.

**Verdict:** ✅ capstone checks green (6/6).

