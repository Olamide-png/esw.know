# Agent Space Integration Guide — ESW Know

This document is the exact package and checklist you can paste into Google Agent Studio / Agent Space so agents can call the adapter and return reliable RAG answers.

Use this as the authoritative installation / onboarding doc for Agent Space.

---

## 1) Files to upload / paste
- `google-agent/agent-manifest.json` — manifest describing tools: `doc_search`, `doc_extract`, `ask_llm`. The manifest uses the placeholder `${MCP_SERVER_BEARER}` for the bearer token so you can map it to Agent Space secrets.
- (Optional) `google-agent/node-client/agent_client.js` — a local test harness that demonstrates both aggregated JSON and SSE streaming parsing.

Do NOT commit secrets into the manifest or repo. Use Agent Space secret management.

---

## 2) Secrets to add to Agent Space
- `MCP_SERVER_BEARER` -> value: `devsecret` (or your production bearer token)
- (Optional) `OPENAI_API_KEY` -> value: `sk-...` (only if the agent will call `ask_llm` which triggers LLM calls in the sidecar)

Recommendation: store these in Agent Space's secret manager and reference them by secret name in the manifest. Do not paste secret values into the manifest file.

---

## 3) Tool definitions to register (Agent Studio fields)

Register the following tools in Agent Studio (fields below are the minimal set you need):

- Name: `doc_search`
  - Method: `POST`
  - URL: `https://mcp.eswdocs.cc/api/mcp-tools`
  - Headers:
    - `Authorization: Bearer ${MCP_SERVER_BEARER}`
    - `Content-Type: application/json`
  - Body template:
    ```text
    {"action":"tool.call","tool":"doc_search","params":<INPUT>}
    ```
  - Input schema: `{ required: ["query"], properties: { query: string, k: integer } }`

- Name: `doc_extract`
  - Method: `POST`
  - URL: `https://mcp.eswdocs.cc/api/mcp-tools`
  - Body template:
    ```text
    {"action":"tool.call","tool":"doc_extract","params":<INPUT>}
    ```
  - Input schema: `{ required: ["path"], properties: { path: string, max_chars: integer } }`

- Name: `ask_llm`
  - Method: `POST`
  - URL: `https://mcp.eswdocs.cc/api/mcp-tools`
  - Headers (optional streaming): include `Accept: text/event-stream` if you want streaming
  - Body template:
    ```text
    {"action":"tool.call","tool":"ask_llm","params":<INPUT>}
    ```
  - Input schema: `{ required: ["query"], properties: { query: string, k: integer, max_chars_per_doc: integer, llm: object } }`

---

## 4) Runtime settings and expectations
- Default adapter timeout: 15s (MCP_TIMEOUT_MS). For `ask_llm` you may need to increase this in production.
- Retries: implement 1 retry on 502/504 with exponential backoff (e.g., 500ms → 1s).
- Streaming: set `Accept: text/event-stream` for SSE streaming; parse SSE frames (each frame begins with `data:` and contains JSON).
- Aggregated: if the client does not request SSE, the adapter aggregates SSE into a final JSON response. Look for a `result` envelope either at top-level or inside `messages[]`.

---

## 5) Example test calls (copy/paste)
- doc_search (JSON):
```json
{ "action": "tool.call", "tool": "doc_search", "params": { "query": "Rounding Rules", "k": 5 } }
```

- doc_extract:
```json
{ "action": "tool.call", "tool": "doc_extract", "params": { "path": "/docs/fr/1.getting-started/6.core-price-construction/1.rounding-rules", "max_chars": 4000 } }
```

- ask_llm (SSE):
```json
{ "action": "tool.call", "tool": "ask_llm", "params": { "query": "How do I round JPY prices?", "k": 3, "max_chars_per_doc": 2000, "llm": { "enabled": true, "model": "gpt-4o-mini" } } }
```

When testing through the adapter, ensure the request includes `Authorization: Bearer ${MCP_SERVER_BEARER}`.

---

## 6) Response parsing notes
- SSE envelopes: JSON objects with `message_type` in {`begin-nlweb-response`, `intermediate_message`, `result`, `end-nlweb-response`, `error`}.
- Aggregated JSON may contain one of the following shapes:
  - `ok: false` → error
  - `ok: true` with `messages: []` → no results (treat as empty)
  - a direct `result` envelope with `content` array → use that
- Implementation detail: look for `message_type === 'result'` or top-level `content` to extract the returned `Item` array.

Each returned `Item` has: `@type` ("Item"), `url`, `name`, `site`, `description`.

---

## 7) Optional: import manifest / OpenAPI
- If Agent Studio supports OpenAPI or JSON import, upload `google-agent/agent-manifest.json` and map `${MCP_SERVER_BEARER}` to the secret you registered.
- If Agent Studio requires explicit secret references, replace placeholder with the secret reference string used by Agent Space.

---

## 8) Quick local verification (run *before* pointing Google Agent Space at it)
- JSON mode (aggregated):
```bash
MCP_BEARER=devsecret node google-agent/node-client/agent_client.js --mode=json
```
- SSE mode (streaming):
```bash
MCP_BEARER=devsecret node google-agent/node-client/agent_client.js --mode=sse
```

The test harness prints parsed envelopes and shows `result` content for `doc_search`.

---

## 9) Suggested agent behavior (recommended flow)
1. Call `doc_search(query, k=5)`.
2. If results found, call `doc_extract(path)` for top 1–3 results.
3. Option A: call `ask_llm` with the extracted text (RAG) — this will synthesize an answer and include sources.
   Option B: assemble extracted text locally and call your own LLM with the context.
4. If no results, ask the user to clarify or run an LLM-only fallback and mark the answer as unverified.

---

## 10) Troubleshooting notes
- `401 Unauthorized` from adapter: verify the `MCP_SERVER_BEARER` secret in Agent Space and that the header is being sent.
- `502` from adapter: adapter could not reach sidecar — check adapter and sidecar logs; confirm sidecar bound to `127.0.0.1:7015` and `cloudflared` mapping.
- Empty `messages: []`: sidecar returned no RAG hits — confirm Postgres `rag_chunks` has relevant rows and sidecar logs show successful queries.
- `database not available` envelope: the sidecar started without `DATABASE_URL` or pool failed to create; confirm `DATABASE_URL` in the sidecar environment.

---

## 11) Security recommendations
- Never store `OPENAI_API_KEY` or bearer tokens in public repo files. Use Agent Space secrets or your own secret manager.
- Limit the adapter bearer token scope to read-only tool calls if possible.

---

If you want, I can convert this to:
- a full OpenAPI 3.0 spec for easier import, or
- an Agents-API specific manifest (if you tell me which Google Agent product/version you're using).

If you'd like that, say which format and I will generate it next.
