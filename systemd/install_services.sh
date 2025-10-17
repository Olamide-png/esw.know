#!/usr/bin/env bash
# Install systemd units for ESW Know services. Run as root on the target host.
set -euo pipefail

ROOT_DIR=/opt/esw.know
SYSTEMD_DIR=/etc/systemd/system
ENV_FILE=/etc/esw_know.env

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root (sudo)." >&2
  exit 1
fi

echo "Copying files to $ROOT_DIR and $SYSTEMD_DIR"
mkdir -p $ROOT_DIR
cp -r $(pwd)/* $ROOT_DIR/

cp $ROOT_DIR/systemd/adapter.service $SYSTEMD_DIR/adapter@.service
cp $ROOT_DIR/systemd/nlweb-sidecar.service $SYSTEMD_DIR/nlweb-sidecar@.service
cp $ROOT_DIR/systemd/cloudflared.service $SYSTEMD_DIR/cloudflared@.service

echo "Creating environment file at $ENV_FILE (edit this file with production values)"
cat > $ENV_FILE <<'EOF'
# Environment variables for ESW Know services
# Example values — replace with production values before enabling services
DATABASE_URL=""
OPENAI_API_KEY=""
MCP_SERVER_BEARER="devsecret"
MCP_SIDECAR_BEARER="sidecarsecret"
ADAPTER_URL="http://127.0.0.1:3000"
RAG_DIM=1536
EOF

systemctl daemon-reload

echo "Enabling and starting services using user 'esw' (create system user esw if needed)."
useradd --system --no-create-home --shell /usr/sbin/nologin esw || true

systemctl enable --now adapter@esw.service
systemctl enable --now nlweb-sidecar@esw.service
systemctl enable --now cloudflared@esw.service

echo "Services enabled and started. Check status with: systemctl status adapter@esw nlweb-sidecar@esw cloudflared@esw"

echo "Note: edit $ENV_FILE with production secrets and restart services. Add logrotate/journald configuration as needed."
