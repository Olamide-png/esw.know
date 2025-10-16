#!/usr/bin/env bash
set -euo pipefail

# Kill anything stale
pkill -f 'cloudflared.*mcp-nuxt-2' 2>/dev/null || true
[ -f /tmp/adapter.pid ] && kill "$(cat /tmp/adapter.pid)" 2>/dev/null || true
[ -f /tmp/sse.pid ] && kill "$(cat /tmp/sse.pid)" 2>/dev/null || true

# Start adapter (JSON on :3000)
nohup node adapter-server.mjs > /tmp/adapter.log 2>&1 & echo $! > /tmp/adapter.pid

# Start local SSE sidecar stub on :7015 (replace with your real sidecar when ready)
nohup node sse-sidecar.mjs > /tmp/sse.log 2>&1 & echo $! > /tmp/sse.pid

# Start Cloudflare tunnel
: "${CF_TUNNEL_ID:?CF_TUNNEL_ID must be set (export CF_TUNNEL_ID=e3a82fe8-5b66-4324-8bb6-e08edc0c7d7e)}"
nohup cloudflared --config "$HOME/.cloudflared/config2.yml" \
      --cred-file "$HOME/.cloudflared/$CF_TUNNEL_ID.json" \
      tunnel run mcp-nuxt-2 > /tmp/cloudflared.log 2>&1 & echo $! > /tmp/cloudflared.pid

sleep 1
echo "PIDs: adapter=$(cat /tmp/adapter.pid) sidecar=$(cat /tmp/sse.pid) cloudflared=$(cat /tmp/cloudflared.pid)"
echo "Logs: /tmp/adapter.log /tmp/sse.log /tmp/cloudflared.log"
