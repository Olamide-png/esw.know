#!/usr/bin/env bash
set -euo pipefail

# pnpm
corepack enable
corepack prepare pnpm@10.11.0 --activate

# Python venv for NLWeb sidecar (optional)
python3 -m venv NLWeb/.venv
source NLWeb/.venv/bin/activate
pip install --upgrade pip
if [ -f NLWeb/code/python/requirements.txt ]; then
  pip install -r NLWeb/code/python/requirements.txt
fi
deactivate

# Cloudflared (optional; only if you want a tunnel in Codespace)
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi

echo "✅ Post-create complete."
