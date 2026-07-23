# Container X-Ray

A live visualizer for **your real docker state** on this machine. One evolving tool, one
lens per part of the course spine — no simulation, no fake data. If a panel is empty, it's
because nothing is running yet, not because the tool is broken.

- **Wiring lens (M1/M2):** every running course container with its host port map, native
  Ollama's status + pulled models, and a live `host.docker.internal:11434` reachability
  check — the exact wiring `labs/m1/call-ollama.sh` proves, run again on every poll.
- **Stack lens (M5/M6/M7):** each `docker compose` project currently up (`m5`, `m6`, `m7`,
  `capstone`, …) with its services, volumes, and networks, and each service's health state.
- **Platform lens (Capstone):** every known course image cached on this machine
  (`m2-client`, `vllm-cpu-optimized`, `m5-genai-app`, `capstone-genai-app`,
  `acme-support-agent`, `acme-incident-crew`, `chromadb/chroma`, `registry`) with size, total
  image disk usage, and a one-glance "what's running right now" overview.

## Run it

```bash
bash labs/tools/container-xray/serve.sh   # then open http://127.0.0.1:8787/
```

Bring up whatever lab stack you want to inspect first (or after — the page keeps polling):

```bash
bash labs/m5/up.sh          # Stack + Wiring lenses populate with m5's chromadb + genai-app
bash labs/capstone/up.sh    # Platform lens fills in with all course images + the capstone stack
```

Stop the tool with `Ctrl-C`. Port busy? `PORT=8788 bash labs/tools/container-xray/serve.sh`.
Slower machine or want less docker-CLI churn? `INTERVAL=5 bash labs/tools/container-xray/serve.sh`.

## How it works (this is a teaching point)

There is no backend to write and no token to paste. `serve.sh` does two things at once:

1. Runs `collect.sh` — a plain POSIX shell adapter that shells out to `docker ps`,
   `docker compose ls`, `docker volume ls`, `docker network ls`, `docker images`, and
   `curl localhost:11434/api/tags` — every ~3 seconds, writing the result to `state.json`
   in this same directory.
2. Serves this directory with Python's stdlib static server (`python3 -m http.server`).

Because the page and `state.json` are served from the **same origin**, `index.html` can
`fetch("state.json")` with a plain `fetch()` call — no CORS, no auth layer, no proxy. The
adapter reuses the credentials you already have configured (your docker context, your
Rancher Desktop / Colima / OrbStack socket) exactly the way you'd use them at the terminal.
Docker's CLI has no watch/stream API the way Kubernetes does, so instead of a long-lived
connection this tool **polls** — a deliberately simple design that stays well under any
browser connection budget.

## Troubleshooting

- **`docker: command not found`** — `docker` isn't on the default macOS PATH when Rancher
  Desktop installs it; `serve.sh` and `collect.sh` both set
  `PATH="$HOME/.rd/bin:$PATH"` internally, so running them directly (`bash serve.sh`) works
  even if your interactive shell doesn't have `docker` on PATH.
- **Every lens shows "nothing running"** — you haven't started any lab stack yet, or you
  tore it down. Bring one up (`bash labs/m5/up.sh`, `bash labs/capstone/up.sh`, …) and give
  the poll loop a few seconds — it refreshes automatically.
- **Wiring lens says Ollama "not reachable"** — Ollama isn't serving on `:11434`. Start it
  with `ollama serve`, confirm with `curl http://localhost:11434/api/tags`, then refresh.
- **`host.docker.internal` shows unreachable but Ollama is up** — your container runtime
  isn't injecting the `host.docker.internal` DNS entry. See the M1 lab's troubleshooting
  section for the fix per runtime (Rancher Desktop / Colima / OrbStack / Podman).
- **Port busy** — `PORT=8788 bash labs/tools/container-xray/serve.sh`.
- **State looks stale (yellow/red dot, top right)** — the poll loop stopped or a single
  `docker` call errored. Check the terminal running `serve.sh` for output; Ctrl-C and
  restart if needed. `state.json` is regenerated fresh on every restart.
- **rtk / shell hook issues** — this tool intentionally avoids heavy dependencies; `serve.sh`
  and `collect.sh` rely on plain POSIX tools (no `jq` or Python for data transformation).
  Run them with `bash serve.sh` directly if your shell has command-rewriting hooks installed.
