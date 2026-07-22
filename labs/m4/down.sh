#!/usr/bin/env bash
# M4 · KitOps — remove the local registry container. Idempotent.
set -uo pipefail
export PATH="$HOME/.rd/bin:$PATH"

REGISTRY_NAME="m4-registry"

docker rm -f "$REGISTRY_NAME" >/dev/null 2>&1 || true
exit 0
