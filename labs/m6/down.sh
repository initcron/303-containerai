#!/usr/bin/env bash
# M6 · Declarative Agent — full teardown: compose stack + ToolHive fetch server (per lab.md's
# fixed teardown: stop then rm, so no ingress/egress/dns sidecars are left behind). Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"
export DOCKER_HOST="unix://$HOME/.rd/docker.sock"

cd "$(dirname "$0")"

thv stop fetch >/dev/null 2>&1 || true
thv rm fetch >/dev/null 2>&1 || true

docker compose down --remove-orphans
exit 0
