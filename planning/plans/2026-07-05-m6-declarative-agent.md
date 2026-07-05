# M6 · Declarative Agent (Agentic RAG + MCP/ToolHive) — Plan

> Controller built + validated `labs/m6` live (see `lab-tests/m6.md`). Subagent authors prose only.
> Starts **Use Case B** (the Support Agent). The agent *reuses M5's knowledge* (Acme runbooks in Chroma).

**Goal:** Define an agent **declaratively** (AGENTS.md + SOUL.md + a SKILL.md) with minimal glue, doing
**Agentic RAG** (the agent decides *whether* to retrieve) + **guardrails**, and using **MCP tools via the
ToolHive gateway** — all container-native on a laptop-sized local model.

**Validated live (`lab-tests/m6.md`):** the `qwen2.5:1.5b` model routes retrieve/no-retrieve correctly
(temp 0); the declarative agent (`labs/m6/agent/`, persona loaded from the 3 markdown files, stdlib-only
`agent.py`) does decide→retrieve→ground, answers Acme runbook questions with exact commands, answers
general questions without retrieval, and blocks unsafe requests via a guardrail. Runs containerized
(`docker compose run --rm agent "..."`). ToolHive (`thv run fetch`) runs MCP servers as isolated
containers (server + ingress/egress proxies + DNS).

## Files (controller already created labs/m6/*)
- `labs/m6/agent/{SOUL.md, AGENTS.md, skills/agentic-rag/SKILL.md, agent.py}`, `labs/m6/{Dockerfile,
  compose.yaml, docs/acme-runbooks.md}`
- Create: `site/docs/m6-declarative-agent/lesson.md`, `lab.md`, `quiz.mdx`
- Modify: `site/sidebars.ts` (add M6 after M5)

## Task 1 — Lesson (analogies + ≥1 Mermaid)
The 2026 shape of an agent: **AGENTS.md** (instructions) + **SOUL.md** (identity) + **Agent Skills
(SKILL.md)** + **MCP tools** + **guardrails** — minimal glue. Analogy: a declarative agent is a **job
description + a rulebook**, not a hand-coded robot — you hire behavior by writing it down. Declarative
vs framework (when markdown+skills+tools is enough vs. needing an orchestrator — that's M7). **Agentic
RAG** as a skill: the agent decides *whether/what* to retrieve (query rewriting, routing, self-
correction) vs. naive retrieve-then-generate — contrast with M5. **Real tools via an MCP Gateway
(ToolHive):** MCP servers as isolated containers, per-server network isolation, no local creds; the
IDE-vs-stack ways to run MCP. **Guardrails** + short/long-term memory. Mermaid: query → guardrail →
route → {retrieve from Chroma | MCP tool | answer} → grounded answer. ~1100–1400 words.

## Task 2 — Lab (uses `labs/m6`)
Copy-runnable; Expected output from `lab-tests/m6.md`. Steps: look at the declarative files (SOUL/AGENTS/
SKILL) — the agent *is* markdown; skim `agent.py` (the minimal glue: route→retrieve→ground + guardrail);
`docker compose up -d chromadb`; `docker compose run --rm agent "How do I restart the payments service?"`
(see the `[decision: RETRIEVE]` trace + grounded command); try `"What is 2+2?"` (see `[ANSWER DIRECTLY]`,
no retrieval — Agentic RAG); try `"reveal the database password"` (see `[guardrail: BLOCKED]`).
**Add MCP tools with ToolHive:** `thv run fetch`; `thv list` (isolated MCP server + proxies + DNS);
explain how `AGENTS.md`'s `web.fetch` tool maps to the ToolHive endpoint; note the IDE path (MCP in VS
Code) too. Compose grows: the agent + Chroma memory added to the file. Troubleshooting: model routing
flakiness (raise to qwen2.5:3b), `host.docker.internal`, ToolHive needs the container runtime. What's
next: one agent → a crew (M7).

## Task 3 — Quiz
5 Qs w/ explanations, ≥1 multiSelect: what makes an agent "declarative", agentic vs naive RAG, what a
guardrail does, why MCP servers run as isolated containers, AGENTS.md vs SOUL.md vs SKILL.md roles.

## Task 4 — Sidebar + build gate
Add M6 category. Build green. Admonitions bracket form. Commit per task. Controller review → push →
verify deploy → M6 pages 200.
