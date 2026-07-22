#!/usr/bin/env bash
# M2 · client speaks OpenAI /v1 against native Ollama — no long-running service to start.
# The `client` compose service is ephemeral (`docker compose run --rm`), so "up" here just
# confirms native Ollama is reachable and builds the client image ahead of the checks.
set -euo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

TIMEOUT=30
ELAPSED=0
until curl -sf http://localhost:11434/v1/models >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "FAIL: native Ollama not reachable on :11434 after ${TIMEOUT}s. Start it with 'ollama serve'." >&2
    exit 1
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

docker compose build

echo "m2 ready: native Ollama reachable, client image built."
