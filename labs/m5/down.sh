#!/usr/bin/env bash
# M5 · Docs Assistant — full teardown (containers + network). Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

docker compose down --remove-orphans
exit 0
