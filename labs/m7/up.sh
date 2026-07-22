#!/usr/bin/env bash
# M7 · Incident Crew — start ChromaDB (the Investigator's knowledge base) and build the crew
# image. The crew itself is one-shot (`docker compose run --rm crew "..."`), so "up" prepares
# the persistent dependency + image ahead of the checks.
set -euo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

TIMEOUT=30
ELAPSED=0
until curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "FAIL: native Ollama not reachable on :11434 after ${TIMEOUT}s. Start it with 'ollama serve'." >&2
    exit 1
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

docker compose up -d chromadb

PORT="${M7_CHROMA_PORT:-8000}"
TIMEOUT=60
ELAPSED=0
until curl -sf "http://localhost:${PORT}/api/v2/heartbeat" >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "FAIL: chromadb did not become ready within ${TIMEOUT}s." >&2
    docker compose logs --tail 50 chromadb >&2 || true
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

docker compose build crew

echo "m7 ready: chromadb healthy, crew image built."
