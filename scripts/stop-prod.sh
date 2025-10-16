#!/usr/bin/env bash
set -euo pipefail
# Stop adapter and cloudflared started by start-prod.sh
if [ -f /tmp/cloudflared.pid ]; then
  kill "$(cat /tmp/cloudflared.pid)" 2>/dev/null || true
  rm -f /tmp/cloudflared.pid
fi
if [ -f /tmp/adapter.pid ]; then
  kill "$(cat /tmp/adapter.pid)" 2>/dev/null || true
  rm -f /tmp/adapter.pid
fi
# fallback: kill any remaining processes
pkill -f adapter-server.mjs || true
pkill -f "cloudflared tunnel run" || true
echo "Stopped production adapter and cloudflared."
