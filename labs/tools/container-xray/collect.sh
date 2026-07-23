#!/usr/bin/env sh
# collect.sh — the Container X-Ray adapter.
# Shells out to docker + the native Ollama HTTP API and emits ONE JSON document
# describing the learner's REAL local state. serve.sh calls this in a loop and
# writes the result to state.json, which index.html polls over plain HTTP (same
# origin as the static server, so no CORS to solve).
#
# Deliberately plain POSIX sh + docker CLI text output — no jq dependency
# assumed present on a learner's machine (mirrors the course's "labs run
# anywhere" stance). Uses `case` for membership tests rather than nested
# word-split loops, because those interact badly with a temporarily-narrowed
# IFS (newline-only, needed to iterate multi-line docker output safely).
set -u

PATH="$HOME/.rd/bin:$PATH"
export PATH

# ---- known course image basenames (Platform lens), | -joined for `case` ----
KNOWN_IMAGES="|m2-client|vllm-cpu-optimized|m5-genai-app|capstone-genai-app|acme-support-agent|acme-incident-crew|chromadb/chroma|registry|"

is_known_image() {
  case "$KNOWN_IMAGES" in
    *"|$1|"*) return 0 ;;
    *) return 1 ;;
  esac
}

json_escape() {
  # Minimal JSON string escaper for values we interpolate by hand.
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

NL='
'

# ---- 1. docker engine reachability ------------------------------------------
if docker version >/dev/null 2>&1; then
  DOCKER_OK=true
else
  DOCKER_OK=false
fi

# ---- 2. running containers (Wiring + Stack lenses) --------------------------
# One JSON object per line: name, image, status, ports, compose project/service.
CONTAINERS_JSON="[]"
if [ "$DOCKER_OK" = "true" ]; then
  LINES=$(docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.Label "com.docker.compose.project"}}|{{.Label "com.docker.compose.service"}}' 2>/dev/null)
  if [ -n "$LINES" ]; then
    ITEMS=""
    OLDIFS="$IFS"
    IFS="$NL"
    for LINE in $LINES; do
      IFS='|' read -r NAME IMAGE STATUS PORTS PROJECT SERVICE <<EOF
$LINE
EOF
      RUNNING=false
      case "$STATUS" in
        Up*) RUNNING=true ;;
      esac
      ITEM=$(printf '{"name":"%s","image":"%s","status":"%s","ports":"%s","project":"%s","service":"%s","running":%s}' \
        "$(json_escape "$NAME")" "$(json_escape "$IMAGE")" "$(json_escape "$STATUS")" \
        "$(json_escape "$PORTS")" "$(json_escape "$PROJECT")" "$(json_escape "$SERVICE")" "$RUNNING")
      if [ -z "$ITEMS" ]; then ITEMS="$ITEM"; else ITEMS="$ITEMS,$ITEM"; fi
    done
    IFS="$OLDIFS"
    CONTAINERS_JSON="[$ITEMS]"
  fi
fi

# ---- 3. compose projects (Stack lens): project -> services/volumes/networks -
# `docker compose ls` only supports table|json for --format (no Go templates).
COMPOSE_JSON="[]"
if [ "$DOCKER_OK" = "true" ]; then
  PROJ_NAMES=$(docker compose ls --format json 2>/dev/null | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    data = []
for p in data:
    print(p.get("Name", "") + "\t" + p.get("Status", ""))
' 2>/dev/null)
  if [ -n "$PROJ_NAMES" ]; then
    PITEMS=""
    OLDIFS="$IFS"
    IFS="$NL"
    for PLINE in $PROJ_NAMES; do
      PNAME=$(printf '%s' "$PLINE" | cut -f1)
      PSTATUS=$(printf '%s' "$PLINE" | cut -f2)
      [ -z "$PNAME" ] && continue

      VOL_ITEMS=""
      VOLS=$(docker volume ls --format '{{.Name}}' 2>/dev/null)
      IFS="$NL"
      for V in $VOLS; do
        case "$V" in
          "${PNAME}_"*|"${PNAME}-"*)
            VI=$(printf '"%s"' "$(json_escape "$V")")
            if [ -z "$VOL_ITEMS" ]; then VOL_ITEMS="$VI"; else VOL_ITEMS="$VOL_ITEMS,$VI"; fi
            ;;
        esac
      done

      NET_ITEMS=""
      NETS=$(docker network ls --format '{{.Name}}' 2>/dev/null)
      for N in $NETS; do
        case "$N" in
          "${PNAME}_"*)
            NI=$(printf '"%s"' "$(json_escape "$N")")
            if [ -z "$NET_ITEMS" ]; then NET_ITEMS="$NI"; else NET_ITEMS="$NET_ITEMS,$NI"; fi
            ;;
        esac
      done

      PITEM=$(printf '{"name":"%s","status":"%s","volumes":[%s],"networks":[%s]}' \
        "$(json_escape "$PNAME")" "$(json_escape "$PSTATUS")" "$VOL_ITEMS" "$NET_ITEMS")
      if [ -z "$PITEMS" ]; then PITEMS="$PITEM"; else PITEMS="$PITEMS,$PITEM"; fi
    done
    IFS="$OLDIFS"
    COMPOSE_JSON="[$PITEMS]"
  fi
fi

# ---- 4. course images cached (Platform lens) --------------------------------
IMAGES_JSON="[]"
if [ "$DOCKER_OK" = "true" ]; then
  ALL_IMG=$(docker images --format '{{.Repository}}:{{.Tag}}|{{.Size}}|{{.ID}}' 2>/dev/null)
  if [ -n "$ALL_IMG" ]; then
    IITEMS=""
    OLDIFS="$IFS"
    IFS="$NL"
    for ILINE in $ALL_IMG; do
      IFS='|' read -r REPOTAG SIZE ID <<EOF
$ILINE
EOF
      REPO=$(printf '%s' "$REPOTAG" | cut -d: -f1)
      if is_known_image "$REPO"; then
        IITEM=$(printf '{"repoTag":"%s","size":"%s","id":"%s"}' \
          "$(json_escape "$REPOTAG")" "$(json_escape "$SIZE")" "$(json_escape "$ID")")
        if [ -z "$IITEMS" ]; then IITEMS="$IITEM"; else IITEMS="$IITEMS,$IITEM"; fi
      fi
    done
    IFS="$OLDIFS"
    IMAGES_JSON="[$IITEMS]"
  fi
fi

# Total disk used by docker images, from `docker system df`.
DISK_TOTAL="unknown"
if [ "$DOCKER_OK" = "true" ]; then
  DF_LINE=$(docker system df --format '{{.Type}}|{{.Size}}' 2>/dev/null | awk -F'|' '$1=="Images"{print $2}')
  if [ -n "$DF_LINE" ]; then DISK_TOTAL="$DF_LINE"; fi
fi

# ---- 5. native Ollama reachability + models (Wiring lens) -------------------
OLLAMA_UP=false
OLLAMA_MODELS_JSON="[]"
TAGS=$(curl -s --max-time 2 http://localhost:11434/api/tags 2>/dev/null)
if [ -n "$TAGS" ]; then
  case "$TAGS" in
    *'"models"'*) OLLAMA_UP=true ;;
  esac
  if [ "$OLLAMA_UP" = "true" ]; then
    # Pull out "name":"..." occurrences without jq.
    NAMES=$(printf '%s' "$TAGS" | grep -o '"name":"[^"]*"' | sed -e 's/"name":"//' -e 's/"$//')
    NITEMS=""
    OLDIFS="$IFS"
    IFS="$NL"
    for N in $NAMES; do
      NI=$(printf '"%s"' "$(json_escape "$N")")
      if [ -z "$NITEMS" ]; then NITEMS="$NI"; else NITEMS="$NITEMS,$NI"; fi
    done
    IFS="$OLDIFS"
    OLLAMA_MODELS_JSON="[$NITEMS]"
  fi
fi

# ---- 6. host.docker.internal reachability FROM a container ------------------
# Cheap and real: run the same curlimages/curl probe M1's call-ollama.sh proves.
HDI_OK=false
if [ "$DOCKER_OK" = "true" ]; then
  if docker run --rm --network bridge curlimages/curl:latest -sf --max-time 2 \
      http://host.docker.internal:11434/api/tags >/dev/null 2>&1; then
    HDI_OK=true
  fi
fi

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

printf '{"timestamp":"%s","dockerOk":%s,"containers":%s,"compose":%s,"images":%s,"diskImages":"%s","ollamaUp":%s,"ollamaModels":%s,"hostDockerInternalOk":%s}\n' \
  "$TS" "$DOCKER_OK" "$CONTAINERS_JSON" "$COMPOSE_JSON" "$IMAGES_JSON" "$(json_escape "$DISK_TOTAL")" "$OLLAMA_UP" "$OLLAMA_MODELS_JSON" "$HDI_OK"
