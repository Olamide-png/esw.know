#!/usr/bin/env bash
set -euo pipefail
for f in /tmp/adapter.pid /tmp/sse.pid /tmp/cloudflared.pid; do
  [ -f "$f" ] && { kill "$(cat "$f")" 2>/dev/null || true; rm -f "$f"; }
done
pkill -f 'cloudflared.*mcp-nuxt-2' 2>/dev/null || true
echo "Stopped."
