#!/usr/bin/env sh
# Run untrusted / model-generated code in a locked-down, throwaway container.
# No network, read-only rootfs, all Linux capabilities dropped, resource-capped.
# Usage:  ./sandbox.sh 'print("hello from the sandbox")'
set -eu
CODE="${1:-print(\"sandboxed:\", sum(range(10)))}"
docker run --rm \
  --network none \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --pids-limit 64 \
  --memory 256m \
  --cpus 1 \
  python:3.12-slim python -c "$CODE"
