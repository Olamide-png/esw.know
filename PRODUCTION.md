Production origin: adapter-server

This repository ships a small adapter proxy (`adapter-server.mjs`) that forwards MCP POSTs to the sidecar `/ask` endpoint. For testing and lightweight production, we run the adapter as the origin and route the public hostname `mcp.eswdocs.cc` to it using Cloudflare Tunnel.

Quick start (on the host with credentials):

```bash
# start the adapter + tunnel
pnpm run prod:up

# check status
ss -ltnp | grep 3000
tail -n 200 /tmp/cloudflared.log

# stop
pnpm run prod:down
```

Notes:
- The adapter listens on 127.0.0.1:3000 by default.
- Cloudflared is configured at `.cloudflared/config.yml` to map `mcp.eswdocs.cc` to `http://127.0.0.1:3000`.
- Logs: `/tmp/adapter.log`, `/tmp/cloudflared.log`, `/tmp/sidecar.log`.

If you later want to expose the full Nuxt app in production, build `www` on a machine with sufficient RAM and deploy its preview/static output, then change `.cloudflared/config.yml` to point the hostname at the Nuxt server instead of the adapter.