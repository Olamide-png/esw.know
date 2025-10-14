#!/usr/bin/env bash
set -euo pipefail

CFG="${HOME}/.cloudflared/config.yml"
TUN="mcp-nuxt"

if [[ ! -f "$CFG" ]]; then
  echo "cloudflared config not found at $CFG"; exit 1
fi

# Runs in foreground so process managers (concurrently) can track it
exec cloudflared tunnel --config "$CFG" run "$TUN"
