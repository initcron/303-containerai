#!/usr/bin/env bash
# M3 · vLLM CPU — full teardown (container + volume). Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

docker compose down -v --remove-orphans
exit 0
