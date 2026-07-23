#!/usr/bin/env bash
# Container X-Ray — serve the live visualizer + refresh its state feed.
#
# There is no backend to write and no token to paste: this script runs the
# adapter (collect.sh, which shells `docker ps/inspect/compose ls/images` and
# curls native Ollama) in a loop, writing state.json into this directory, and
# serves the directory itself with Python's stdlib static server. The browser
# fetches state.json from the SAME origin as the page — same trick the
# reference Cluster X-Ray uses with `kubectl proxy`, just with a poll loop
# instead of a proxy, because docker's CLI has no watch API to forward.
set -euo pipefail

PATH="$HOME/.rd/bin:$PATH"
export PATH

PORT="${PORT:-8787}"
INTERVAL="${INTERVAL:-3}"
XRAY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DOCKER_STATUS="not found"
if command -v docker >/dev/null 2>&1 && docker version >/dev/null 2>&1; then
  DOCKER_STATUS="reachable ($(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '?'))"
fi

echo "┌─────────────────────────────────────────────────────────────"
echo "│  Container X-Ray · Wiring · Stack · Platform lenses"
echo "│"
echo "│  docker  : ${DOCKER_STATUS}"
echo "│  poll    : every ${INTERVAL}s -> ${XRAY_DIR}/state.json"
echo "│"
echo "│  open    : http://127.0.0.1:${PORT}/"
echo "│"
echo "│  Ctrl-C stops the server and the poll loop. Port busy? PORT=8788 bash serve.sh"
echo "└─────────────────────────────────────────────────────────────"

# Write one snapshot immediately so the first page load isn't empty.
sh "${XRAY_DIR}/collect.sh" > "${XRAY_DIR}/state.json.tmp" 2>/dev/null || echo '{}' > "${XRAY_DIR}/state.json.tmp"
mv "${XRAY_DIR}/state.json.tmp" "${XRAY_DIR}/state.json"

# Background poll loop: refresh state.json every $INTERVAL seconds.
(
  while true; do
    sleep "${INTERVAL}"
    if sh "${XRAY_DIR}/collect.sh" > "${XRAY_DIR}/state.json.tmp" 2>/dev/null; then
      mv "${XRAY_DIR}/state.json.tmp" "${XRAY_DIR}/state.json"
    fi
  done
) &
POLL_PID=$!

cleanup() {
  kill "${POLL_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

cd "${XRAY_DIR}"
exec python3 -m http.server "${PORT}" --bind 127.0.0.1
