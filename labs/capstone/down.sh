#!/usr/bin/env bash
# Capstone · full teardown — containers, network, AND volumes (the platform demo should leave no
# state behind). Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

cd "$(dirname "$0")"

docker compose down -v --remove-orphans
exit 0
