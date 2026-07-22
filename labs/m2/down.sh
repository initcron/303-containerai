#!/usr/bin/env bash
# M2 · teardown the compose-created network (the client itself always runs with --rm).
# Native Ollama is shared across modules and is never stopped by this script. Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

docker compose down --remove-orphans
exit 0
