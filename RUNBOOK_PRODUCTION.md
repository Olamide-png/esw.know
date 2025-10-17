Runbook: ESW Know - Adapter + Sidecar + Cloudflared

Overview
- adapter-server.mjs: Node adapter which proxies /api/mcp-tools to the sidecar /ask
- NLWeb/webserver/aiohttp_server.py: Python sidecar providing doc_search/doc_extract and ask endpoints
- cloudflared: Cloudflare Tunnel to expose adapter and sidecar to public hostnames

Prerequisites
- Place environment variables in /etc/esw_know.env (key=val, no quotes). Example file is provided below.
- Ensure node and python3 are installed and available at /usr/bin/env
- Place the cloudflared binary and .cloudflared/config.yml in the repository root (already present in this repo)

Example /etc/esw_know.env contents

DATABASE_URL=postgresql://...\nMCP_SERVER_BEARER=devsecret\nMCP_SIDECAR_BEARER=sidecarsecret\nOPENAI_API_KEY=sk-...\n
(also include other vars from the repo .env as needed)

Managing services (systemd)

# Install using the helper script (recommended)
# 1) Copy repo to the target host (e.g. /opt/esw.know)
# 2) Run the installer as root which copies unit files, creates a system user, creates an env template and enables services:
sudo /opt/esw.know/systemd/install_services.sh

# Edit the environment file created at /etc/esw_know.env and populate production values (DATABASE_URL, OPENAI_API_KEY, MCP_SERVER_BEARER, MCP_SIDECAR_BEARER)

# If you prefer manual install steps:
sudo cp .env /etc/esw_know.env
sudo cp systemd/adapter.service /etc/systemd/system/adapter@.service
sudo cp systemd/nlweb-sidecar.service /etc/systemd/system/nlweb-sidecar@.service
sudo cp systemd/cloudflared.service /etc/systemd/system/cloudflared@.service
sudo systemctl daemon-reload
sudo systemctl enable --now adapter@esw service nlweb-sidecar@esw.service cloudflared@esw.service

# Check status
sudo systemctl status adapter@esw nlweb-sidecar@esw cloudflared@esw

Health checks
- Local quick check:
  /workspaces/esw.know/systemd/check_health.sh
- Expose Prometheus-compatible metrics (optional): add an HTTP metrics endpoint to the adapter and sidecar or use a blackbox probe.

Logging & retention
- Journald: create /etc/systemd/journald.conf.d/esw-keep.conf with:
  [Journal]
  SystemMaxUse=200M
  RuntimeMaxUse=200M

- Logrotate: copy `systemd/logrotate-esw-know` to `/etc/logrotate.d/esw-know` and ensure your app writes to /var/log/esw-know/*.log (or adapt to journalctl forwarding).

Logs
- Use journalctl -u adapter.service -f
- Use journalctl -u nlweb-sidecar.service -f
- Use journalctl -u cloudflared.service -f

Troubleshooting
- If adapter returns 502: check cloudflared and sidecar status; verify sidecar bound to 127.0.0.1:7015
- If sidecar reports DB errors: check /etc/esw_know.env DATABASE_URL and connectivity; try psql client
- If cloudflared fails to register: ensure credentials file path in .cloudflared/config.yml is correct and accessible by the service user

Alternative: deploy the adapter on Vercel (24/7)

- The repository includes a Vercel Edge function (`api/mcp-tools.js`) and `vercel.json` which let you deploy the adapter as a serverless function.
- Pros: global availability, no host maintenance, easy scaling.
- Cons: sidecar must be publicly reachable (or you must move the sidecar to a cloud host) and serverless streaming/timeouts vary by platform.

See `VERCEL_DEPLOY.md` for full instructions.

Rollbacks
- Stop the suspect service and restart the previous known-good container or process; use systemctl stop/start

Contact
- On-call: ops@example.com
