#!/usr/bin/env bash
# M8 · Security & Governance — deterministic, no long-running services. "up" just makes sure the
# scan target (the M6 agent image) exists locally, building it from labs/m6/ if needed.
set -euo pipefail
export PATH="$HOME/.rd/bin:$PATH"
export DOCKER_HOST="unix://$HOME/.rd/docker.sock"

cd "$(dirname "$0")"

if ! docker image inspect acme-support-agent:latest >/dev/null 2>&1; then
  docker build -t acme-support-agent:latest ../m6
fi

echo "m8 ready: acme-support-agent:latest present locally."
