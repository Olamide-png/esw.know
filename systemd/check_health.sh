#!/usr/bin/env bash
# Simple health-check for adapter and sidecar
set -euo pipefail

ADAPTER_HOST="127.0.0.1"
ADAPTER_PORT="3000"
SIDECAR_HOST="127.0.0.1"
SIDECAR_PORT="7015"

curl -fsS "http://${ADAPTER_HOST}:${ADAPTER_PORT}/api/ping" >/dev/null && echo "adapter: ok"
curl -fsS "http://${SIDECAR_HOST}:${SIDECAR_PORT}/healthz" >/dev/null && echo "sidecar: ok"
