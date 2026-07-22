#!/usr/bin/env bash
# M4 · KitOps — start a local OCI registry (registry:2) for the pack/push/pull round-trip checks.
set -euo pipefail
export PATH="$HOME/.rd/bin:$PATH"

REGISTRY_NAME="m4-registry"
REGISTRY_PORT="${M4_REGISTRY_PORT:-5001}"

# Idempotent: remove any stale container from a previous run first.
docker rm -f "$REGISTRY_NAME" >/dev/null 2>&1 || true

docker run -d -p "${REGISTRY_PORT}:5000" --name "$REGISTRY_NAME" registry:2 >/dev/null

TIMEOUT=60
ELAPSED=0
until curl -sf "http://localhost:${REGISTRY_PORT}/v2/" >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "FAIL: local registry did not become ready within ${TIMEOUT}s." >&2
    docker logs "$REGISTRY_NAME" >&2 || true
    exit 1
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "local registry ready on :${REGISTRY_PORT} after ~${ELAPSED}s."
