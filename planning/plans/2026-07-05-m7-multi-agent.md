# M7 · Multi-Agent Incident Crew — Plan

> Controller built + validated `labs/m7` live (see `lab-tests/m7.md`). Subagent authors prose only.
> Grows the M6 agent into a crew; completes Use Case B and the growing `compose.yaml`.

**Goal:** Grow one agent into a **crew** — Triage → Investigator → Fixer → Reviewer — built
**declaratively** (one markdown profile per agent, all sharing ONE native model), with a **review/approval
gate**. Show **CrewAI** as the framework example (ported off Docker Model Runner + supergateway to native
Ollama + ToolHive), and note LangGraph for deterministic control.

**Validated live (`lab-tests/m7.md`):** the declarative crew (`labs/m7/crew/` — 4 profiles + `crew.py`,
one shared `qwen2.5:1.5b`) **approves** a runbook-backed 503 fix (`kubectl scale deploy/web --replicas=5
-n prod`) and **escalates** a no-runbook Kafka incident. A **relevance gate** was added after live testing
caught the crew confidently proposing the payments runbook for a Kafka outage — the lesson on why review
loops matter. Runs containerized (`docker compose run --rm crew "..."`).

## Files (controller already created labs/m7/*)
- `labs/m7/crew/{profiles/{triage,investigator,fixer,reviewer}.md, crew.py}`, `labs/m7/{Dockerfile,
  compose.yaml, docs/acme-runbooks.md}`
- Create: `site/docs/m7-multi-agent/lesson.md`, `lab.md`, `quiz.mdx`
- Modify: `site/sidebars.ts` (add M7 after M6)

## Task 1 — Lesson (analogies + ≥1 Mermaid)
Why multi-agent: specialization, separation of concerns, **review loops** — and when a single agent is
enough. Analogy: a crew is a **hospital**: triage nurse → diagnosing doctor → pharmacist → attending who
signs off; each has one job, they share one patient record (the model + memory). Two ways to go
multi-agent: (1) **declarative** — multiple profiles sharing one model (the default, what you built);
(2) **framework** — CrewAI (role-based) / LangGraph (graph, checkpointing, audit) when you need
deterministic control. The standards converge: skills + MCP + guardrails are the same; you swap the
*orchestrator*, not the tools. Sharing one model endpoint (agents are cheap; the model is shared — the
resource-budget point). The review loop as human-in-the-loop proxy. Mermaid: incident → Triage →
Investigator(RAG) → Fixer → Reviewer → {APPROVED | escalate}. ~1100–1400 words.

## Task 2 — Lab (uses `labs/m7`)
Copy-runnable; Expected output from `lab-tests/m7.md`. Steps: read the 4 profiles (each agent IS a
markdown profile), skim `crew.py` (sequential pipeline, shared model, the relevance gate), `docker
compose up -d chromadb`, `docker compose run --rm crew "The checkout page is returning HTTP 503..."`
(see the full Triage→Investigator→Fixer→Reviewer trace + APPROVED), then a no-runbook incident (Kafka →
NO RUNBOOK → REJECTED/escalate — why the relevance gate + reviewer matter). **CrewAI framework variant:**
show the reuse `crew-ai` repo and the two ports to run it anywhere — (1) drop the Compose `models:`/DMR
block, point agents' `OPENAI_BASE_URL` at native Ollama `/v1`; (2) `supergateway` → `thv run duckduckgo`
(ToolHive). Note CrewAI wants a bigger model (gemma3:4B) — reach for a framework when structure is worth
it. Compose completes. Troubleshooting: small-model determinism (temp 0, bump to 3B), relevance-gate
tuning. What's next: harden + ship (M8).

## Task 3 — Quiz
5 Qs w/ explanations, ≥1 multiSelect: why multi-agent, declarative vs framework crews, the shared-model
resource point, what the Reviewer/relevance-gate protects against, CrewAI porting (DMR→Ollama,
supergateway→ToolHive).

## Task 4 — Sidebar + build gate
Add M7 category. Build green. Admonitions bracket form. Commit per task. Controller review → push →
verify deploy → M7 pages 200.
