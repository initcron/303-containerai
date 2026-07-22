#!/usr/bin/env bash
# M8 · Security & Governance — no persistent services to tear down. Cleans up scan/sign
# artifacts and the local registry container that secure-image.sh may have started. Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"
export DOCKER_HOST="unix://$HOME/.rd/docker.sock"

cd "$(dirname "$0")"

docker rm -f local-registry >/dev/null 2>&1 || true
rm -f cosign.key cosign.pub sbom.spdx.json
exit 0
