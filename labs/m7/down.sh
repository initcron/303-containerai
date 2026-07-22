#!/usr/bin/env bash
# M7 · Incident Crew — full teardown (chromadb container + network). The crew container itself
# always runs with --rm. Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

docker compose down --remove-orphans
exit 0
