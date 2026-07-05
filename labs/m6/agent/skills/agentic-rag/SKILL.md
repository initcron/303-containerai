---
name: agentic-rag
description: Decide whether a question needs the Acme runbooks, and if so retrieve the most relevant chunks and answer grounded in them. Use for any question about Acme services, backups, scaling, or on-call.
---

# Agentic RAG skill

This skill is what makes the agent *agentic* rather than a naive retrieve-then-generate pipeline.

## Procedure

1. **Route.** Classify the question: does it require Acme's internal runbooks? Output YES or NO.
   - YES → operational/infra questions about Acme (restart, backup, scale, on-call, incidents).
   - NO → general knowledge, math, greetings, or anything not about Acme's systems.
2. **Retrieve (only if YES).** Embed the question, run a similarity search over the `acme_runbooks`
   collection, take the top chunks.
3. **Ground.** Answer using ONLY the retrieved chunks. Quote exact commands. If the top chunk's
   similarity is weak / irrelevant, say there is no runbook for it.

## Why this beats naive RAG
Naive RAG retrieves for *every* query — wasting a lookup on "what is 2+2?" and stuffing irrelevant
context. Agentic RAG spends the retrieval only when it helps, and can say "I don't have a runbook for
that" instead of hallucinating from a bad match.
