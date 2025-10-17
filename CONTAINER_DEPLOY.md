Container deployment options for the NLWeb sidecar

This guide shows how to build and deploy the sidecar (`NLWeb/webserver/aiohttp_server.py`) as a container to Cloud Run, Fly, or Render. After deployment, point Vercel `MCP_URL` to the container's public `/ask` URL.

Files created
- `sidecar/Dockerfile` — production-ready image for the sidecar
- `sidecar/deploy_cloud_run.sh` — helper script to build & deploy to Cloud Run
- `sidecar/fly.toml` — example Fly config

Environment variables (required)
- DATABASE_URL — Postgres connection (ensure DB is reachable from the container)
- MCP_SIDECAR_BEARER — secret for adapter -> sidecar
- OPENAI_API_KEY — if you use OpenAI for embeddings/LLM
- RAG_DIM — embedding dimension (1536)

Cloud Run (Google Cloud) — quick start
1) Authenticate and set project:
```bash
gcloud auth login
gcloud config set project <GCP_PROJECT_ID>
```
2) From repo root, build & deploy:
```bash
chmod +x sidecar/deploy_cloud_run.sh
./sidecar/deploy_cloud_run.sh <GCP_PROJECT_ID> esw-sidecar us-central1
```
3) Set env vars in the Cloud Run service (Console or `gcloud run services update`):
   - DATABASE_URL, MCP_SIDECAR_BEARER, OPENAI_API_KEY

4) Verify the public URL and test:
```bash
curl -X POST <CLOUD_RUN_URL>/ask \
  -H "Authorization: Bearer ${MCP_SIDECAR_BEARER}" \
  -H "Content-Type: application/json" \
  -d '{"action":"tool.call","tool":"doc_search","params":{"query":"Rounding Rules","k":3}}'
```

Fly (fly.io) — quick start
1) Install flyctl and login
2) From `sidecar/` run:
```bash
fly launch --name esw-sidecar
fly deploy
```
3) Add secrets via `fly secrets set DATABASE_URL=... MCP_SIDECAR_BEARER=... OPENAI_API_KEY=...`

Troubleshooting on Fly
- Check instance logs:
```bash
fly logs -a esw-sidecar
```
- Check status and instances:
```bash
fly status -a esw-sidecar
fly ips list -a esw-sidecar
```
- Open a remote console on an instance to inspect files or run curl locally:
```bash
fly ssh console -a esw-sidecar
```
- If requests time out, ensure your app is listening on 0.0.0.0 and the port matches `PORT` env (the Dockerfile now binds to 0.0.0.0:7015).

Render / Railway / Other
- Render supports a Dockerfile deploy: add a Web Service pointing at the Dockerfile, set env vars in the dashboard.

Notes
- Ensure Postgres is reachable from the container; consider using a managed DB with private networking or allowlist VPCs.
- For security, restrict the sidecar to accept only requests with `Authorization: Bearer ${MCP_SIDECAR_BEARER}`.
- If you use Cloud Run, prefer HTTPS and set the authentication to `allow-unauthenticated` only if adapter + agent are protected by bearer tokens.
