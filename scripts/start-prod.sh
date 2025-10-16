#!/usr/bin/env bash
set -euo pipefail
# Start adapter and cloudflared tunnel for production
echo "Starting adapter..."
nohup node /workspaces/esw.know/adapter-server.mjs > /tmp/adapter.log 2>&1 & echo $! > /tmp/adapter.pid
sleep 0.4
echo "Starting cloudflared using .cloudflared/config.yml..."
nohup cloudflared --config .cloudflared/config.yml tunnel run 43ba73d8-0290-40ab-ac40-f1922c75eee6 > /tmp/cloudflared.log 2>&1 & echo $! > /tmp/cloudflared.pid
sleep 0.6
echo "Adapter and cloudflared started. Adapter PID: $(cat /tmp/adapter.pid) Cloudflared PID: $(cat /tmp/cloudflared.pid)"
