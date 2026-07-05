#!/usr/bin/env sh
# Open-source supply chain for one image: SBOM -> scan -> sign.
# Usage:  ./secure-image.sh <image-ref>   (e.g. acme-support-agent:latest)
set -eu
IMAGE="${1:-acme-support-agent:latest}"

echo "==> [1/4] SBOM with syft"
syft "$IMAGE" -o spdx-json > sbom.spdx.json
echo "    wrote sbom.spdx.json"

echo "==> [2/4] Vulnerability scan with trivy (CRITICAL/HIGH)"
trivy image --scanners vuln --severity CRITICAL,HIGH "$IMAGE" || true

echo "==> [3/4] Second opinion with grype"
grype "$IMAGE" || true

echo "==> [4/4] Sign with cosign (key-based)"
[ -f cosign.key ] || COSIGN_PASSWORD="" cosign generate-key-pair
COSIGN_PASSWORD="" cosign sign --yes --key cosign.key "$IMAGE"
cosign verify --key cosign.pub "$IMAGE"
echo "Done. Signed and verified $IMAGE."
