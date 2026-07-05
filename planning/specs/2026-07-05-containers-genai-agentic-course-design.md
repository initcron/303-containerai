# Design: Containers for GenAI & Agentic AI — Docusaurus Course

**Date:** 2026-07-05
**Author:** Gourav Shah (with Claude Code / Superpowers)
**Status:** Approved — proceeding to plan
**Source outline:** `../../containers_genai_agentic.md`

---

## 1. Purpose

Build the course content for **"Containers for GenAI & Agentic AI — The Open-Source Way"** as a
Docusaurus site. Part of the MLOps/LLMOps catalogue under School of DevOps & AI, also delivered as a
**2-day corporate workshop**.

The site delivers, **per module**: a reading **Lesson**, a hands-on **Lab**, and a **Quiz**. Every lab
is validated step-by-step on **this Apple Silicon Mac (arm64, 16 GB RAM)** using **Rancher Desktop**
before its module is marked done — so shipped labs are known-good on the course's reference laptop.

## 2. Decisions locked (brainstorming)

- **Harness:** Superpowers end-to-end (brainstorm → writing-plans → executing-plans). Markdown plans
  in `planning/plans/`.
- **Build sequencing:** **Vertical slice first** — scaffold Docusaurus + build **M1** fully
  (Lesson + Lab + Quiz) and **lab-test it live** before scaling the pattern to M2–M8 + Capstone.
- **Lab validation:** Test **each lab** on Rancher Desktop as it is built; log evidence.
- **Primary validation runtime:** **Rancher Desktop** (portability to Colima/OrbStack/Podman noted in
  content).
- **Module layout:** **Three docs per module** — Lesson → Lab → Quiz (each its own sidebar page).
- **Quiz tech:** **Custom React `<Quiz>` MDX component** (no external plugin).

## 3. Environment facts (verified 2026-07-05 on this machine)

- Arch **arm64**, **16 GB RAM** — matches the course's target laptop exactly.
- **Node v22.22.1 / npm 10.9.4** present — Docusaurus ready.
- **No container runtime installed** (no docker/nerdctl/podman/colima/rancher). Rancher Desktop is a
  **Phase 0 prerequisite install**.
- **Ollama not installed** — Phase 0 install (native, Metal-accelerated on Mac).
- The `*.git` files in the parent dir are **saved HTML pages, not clones**. Real repos are cloned from
  GitHub during the build.

## 4. Repo layout (root = `course/`)

```
course/
├── site/                        # Docusaurus app (React, MDX, TypeScript)
│   ├── docs/
│   │   ├── intro.md
│   │   ├── setup/               # Phase 0: runtime + Ollama + prereqs + GPU reality
│   │   ├── m1-container-native/ # lesson.md, lab.md, quiz.mdx
│   │   ├── m2-serving/
│   │   ├── m3-vllm/
│   │   ├── m4-packaging/
│   │   ├── m5-naive-rag/
│   │   ├── m6-declarative-agent/
│   │   ├── m7-multi-agent/
│   │   ├── m8-security/
│   │   └── capstone/            # all modules flat at top level (no Day grouping)
│   ├── src/components/Quiz/      # custom <Quiz> MDX component
│   ├── sidebars.ts
│   └── docusaurus.config.ts
├── labs/                         # runnable lab assets, one dir per module
│   └── m1/ ... m8/ capstone/     # compose.yaml + app code + README
├── planning/
│   ├── specs/                    # this design doc
│   ├── plans/                    # per-module implementation plans (markdown)
│   ├── lab-tests/                # validation evidence logs per lab
│   └── ROADMAP.md                # top-level build tracker
├── reference-repos/              # cloned reuse assets (gitignored)
└── containers_genai_agentic.md   # source outline (kept)
```

Rationale: Docusaurus lives in `site/` so its `docs/` never collides with `planning/`. Runnable lab
code lives in `labs/` (referenced by, but separate from, the prose in `site/docs/.../lab.md`).

## 5. Module content model (3 docs/module)

Modules sit **flat at the top level of `docs/`** (no Day-1/Day-2 grouping — the Day mapping lives in `intro.md`'s program-at-a-glance table only). Each module is a sidebar **category** containing:

- **Lesson** (`lesson.md`) — concepts, diagrams, "when to use which pattern", the container angle,
  the Apple-Silicon-GPU reality where relevant.
- **Lab** (`lab.md`) — self-contained, copy-runnable steps; **every command tested on Rancher
  Desktop**; features the **hand-authored `compose.yaml` growing by one service per module**; includes
  expected-output blocks and troubleshooting callouts. Prose references runnable assets in `labs/mN/`.
- **Quiz** (`quiz.mdx`) — 4–6 questions via the `<Quiz>` component.

## 6. The `<Quiz>` component

Self-contained React component (in `site/src/components/Quiz/`):

- Multiple-choice: single-select and multi-select.
- Instant per-option feedback with explanations.
- Running score tally + reset.
- Questions authored inline in MDX as a JS array (no backend, no persistence — YAGNI).
- One component, reused across all quizzes.

## 7. Phased build

### Phase 0 — Environment (prerequisite)
Install **Rancher Desktop** + **Ollama** on this Mac. Verify `nerdctl`/`docker` CLI, the
`host.docker.internal` wiring, and pull one small model (`qwen2.5:1.5b`). Interactive/GUI installs are
handed to the user as `!` commands or GUI steps. Also authored as the site's **Setup** section.

### Phase 1 — Scaffold + M1 complete (the vertical slice)
1. Scaffold Docusaurus in `site/`, configure nav/sidebar/theme/branding.
2. Build the `<Quiz>` component.
3. Author **M1** Lesson + Lab + Quiz.
4. **Validate the M1 lab live:** runtime up → Ollama serving → call the model from a throwaway
   container proving `host.docker.internal`. Log evidence to `planning/lab-tests/m1.md`.
5. Confirm the full pipeline (content → build → runnable lab) works end-to-end before scaling.

### Phase 2+ — M2 → Capstone (repeat the loop per module)
Each module: clone/adapt reuse asset → author Lesson → author Lab → **run the lab on Rancher Desktop,
capture real output** → author Quiz → mark done. Each module gets its own markdown plan in
`planning/plans/`.

## 8. Cross-cutting defaults (confirmable per module when reached)

- **Models:** `qwen2.5:1.5b` / `qwen2.5:3b` + `nomic-embed-text` (dev); `SmolLM2 135M/360M/1.7B`
  (CPU-vLLM in M3).
- **Vector DB:** **ChromaDB** (matches `lightweight-genai-stack`, fits ≤8 GB). Qdrant/pgvector as
  documented scale-up options.
- **Registry:** **GHCR** for packaging labs (M4).
- **Acme corpus:** small **synthetic runbook set** we generate for the RAG labs (M5+).
- **MCP gateway:** ToolHive (M6/M7). **Multi-agent:** CrewAI concrete example + LangGraph optional
  (M7), reusing `compose-for-agents/crew-ai`.

These affect M3/M5/M6/M7 only — not the Phase 1 slice.

## 9. Reuse asset map

| Reuse repo | Module | Plan |
| --- | --- | --- |
| `schoolofdevops/vllm-cpu-example` | M3 | Direct anchor — SmolLM2, resource presets, NUMA/thread tuning |
| `schoolofdevops/lightweight-genai-stack` | M5 | Direct anchor — Ollama + ChromaDB + Streamlit, Learning Mode |
| `gouravshah/compose-for-agents` (crew-ai) | M7 | Port off Docker-proprietary `models:`/DMR → portable model service + ToolHive |
| `realopsreactor/tech-stack-advisor` | optional | Gentle on-ramp app |

## 10. Tracking

- `planning/ROADMAP.md` — top-level build tracker (phases/modules, status).
- `planning/plans/mN-*.md` — one implementation plan per module (Superpowers writing-plans).
- `planning/lab-tests/mN.md` — validation evidence (commands + real output) per lab.
- `git init` the repo; version specs, plans, content, and lab assets.

## 11. Out of scope (YAGNI)

- No LMS integration, no auth/user accounts.
- No quiz-score persistence or backend.
- No automated lab-runner CI (labs are human-run + logged as evidence).
- No deploy/hosting pipeline yet (local `npm start` for authoring; hosting decided later).

## 12. Success criteria

- Docusaurus site builds and serves locally with working navigation and the `<Quiz>` component.
- **M1 fully authored** (Lesson + Lab + Quiz) with its **lab validated live on Rancher Desktop** and
  evidence logged.
- Repeatable per-module loop documented so M2–M8 + Capstone can follow the same pattern.
