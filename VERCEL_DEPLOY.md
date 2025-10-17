Deploying the Adapter to Vercel (24/7 availability)

This document explains how to deploy the adapter as a serverless Edge Function on Vercel so your Agent Space can call it 24/7.

Files added to this repo:
- `api/mcp-tools.js` — Vercel Edge function implementing the adapter proxy (SSE passthrough + SSE->JSON aggregation)
- `vercel.json` — Vercel routes and builds config

Quick steps
1. Create a new Vercel project and link your GitHub repo (or import the repository manually).
2. In Vercel Project Settings > Environment Variables, add the following variables (Production):
   - `MCP_URL` -> the public URL of your sidecar (if your sidecar remains private, you'll need to expose it or host sidecar on a reachable host)
   - `MCP_SERVER_BEARER` -> the bearer token agents will use
   - `MCP_SIDECAR_BEARER` -> the token the adapter will use to call the sidecar
   - `MCP_TIMEOUT_MS` -> optional timeout in ms
3. Deploy the project. The adapter will be reachable at `https://<your-vercel-domain>/api/mcp-tools`.

Notes and caveats
- The sidecar must be publicly reachable from Vercel. If your sidecar is still local, you can either:
  - Host sidecar in a cloud VM or managed host and point `MCP_URL` to it, or
  - Replace sidecar endpoints with a remote RAG service (e.g., a managed vector DB + API) and use the adapter to glue to that service.
- Streaming SSE passthrough is supported by the adapter; however, some serverless platforms have timeouts on streaming connections — check Vercel's docs about long-lived connections.
- For high throughput or low-latency needs consider deploying the adapter to a small VM (systemd approach) or using Vercel Edge with region pinning.

Security
- Store secrets in Vercel Environment Variables (do NOT commit them to the repo).
- Use firewall / IP allowlist for the sidecar if possible to limit who can call it.

If you'd like, I can:
- Generate a deployment-ready manifest for Vercel (including production env var suggestions), or
- Create a small Docker image and a helm/k8s manifest if you prefer running in Kubernetes.

*** End"
