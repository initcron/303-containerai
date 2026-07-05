# M4 Lab — Packaging Models as OCI Artifacts (KitOps)

Lab assets for Module 4 of **Containers for GenAI & Agentic AI**.

## Contents

| File | Purpose |
|---|---|
| `Kitfile` | ModelKit manifest — describes model, code, and metadata layers |
| `prompts.txt` | System prompt and inference config (the `code` layer) |
| `.gitignore` | Excludes `model/` and `*.gguf` — weights are downloaded, never committed |

## Model weights (not in this repo)

The lab uses `SmolLM2-135M-Instruct-Q4_K_M.gguf` (~100 MB).
Download it before running `kit pack`:

```bash
mkdir -p model
curl -L -o model/SmolLM2-135M-Instruct-Q4_K_M.gguf \
  "https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf"
```

## Quick reference

```bash
kit pack . -t ghcr.io/<you>/acme-docs-model:1.0.0
kit list
kit push ghcr.io/<you>/acme-docs-model:1.0.0
kit unpack ghcr.io/<you>/acme-docs-model:1.0.0 -d ./pulled
kit unpack ghcr.io/<you>/acme-docs-model:1.0.0 --filter=model -d ./weights-only
```

See `site/docs/m4-packaging/lab.md` for the full step-by-step lab with expected outputs.
