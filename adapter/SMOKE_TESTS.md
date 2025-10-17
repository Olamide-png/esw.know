# Adapter Smoke Tests

This document describes the smoke tests that run automatically after deploying the adapter to Fly.io.

## Workflow

The adapter deployment workflow (`.github/workflows/deploy-adapter.yml`) runs automatically when:
- Changes are pushed to the `adapter/` directory
- The workflow file itself is modified

## Smoke Tests

The workflow runs the following smoke tests after deployment:

### 1. Health Check: `/api/ping`

**Request:**
```bash
curl -fsS "https://${ADAPTER_URL}/api/ping"
```

Replace `${ADAPTER_URL}` with your adapter hostname (e.g., `esw-adapter.fly.dev`)

**Expected Response:**
```json
{
  "ok": true,
  "ts": 1729138421315
}
```

### 2. Discovery: `/api/mcp-tools` (GET)

Tests the tool discovery endpoint that lists available MCP tools.

**Request:**
```bash
curl -fsS "https://${ADAPTER_URL}/api/mcp-tools"
```

**Expected Response:**
```json
{
  "ok": true,
  "tools": [
    { "name": "doc_lookup", "title": "Lookup a local doc by path" },
    { "name": "doc_search", "title": "Search docs (semantic/keyword)" },
    { "name": "doc_extract", "title": "Extract full text of a doc by path" }
  ]
}
```

### 3. Realistic Query: `/api/mcp-tools` (POST)

Tests a realistic document search query that gets forwarded to the sidecar.

**Request:**
```bash
curl -fsS -X POST "https://${ADAPTER_URL}/api/mcp-tools" \
  -H "Authorization: Bearer $MCP_SERVER_BEARER" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "tool.call",
    "tool": "doc_search",
    "args": {
      "q": "rounding",
      "k": 3
    }
  }'
```

**Request Details:**
- **action**: `tool.call` - Indicates this is a tool invocation
- **tool**: `doc_search` - The specific tool to invoke
- **args**: Tool-specific arguments
  - **q**: `"rounding"` - Search query for documentation about rounding
  - **k**: `3` - Return top 3 results

**Expected Response:**

The adapter forwards this request to the sidecar at `https://esw-sidecar.fly.dev/ask` and returns the aggregated response. The response format depends on the sidecar's SSE stream, but typically includes:

```json
{
  "ok": true,
  "message_type": "final",
  "results": [
    {
      "path": "/path/to/doc",
      "title": "Rounding Rules Documentation",
      "score": 0.95,
      "snippet": "..."
    }
  ]
}
```

Or, if the sidecar returns multiple messages:

```json
{
  "ok": true,
  "messages": [
    { "message_type": "start", ... },
    { "message_type": "result", ... },
    { "message_type": "final", ... }
  ]
}
```

## Authorization

The POST endpoint requires bearer token authorization when `MCP_SERVER_BEARER` is configured:
```
Authorization: Bearer <token>
```

This is configured as a GitHub secret and passed to the workflow.

## Adapter Architecture

The adapter is a lightweight proxy that:
1. Accepts requests at `/api/mcp-tools` and `/api/mcp`
2. Forwards them to the sidecar at the configured `MCP_URL`
3. Supports both SSE streaming and aggregated JSON responses
4. Provides optional bearer token authentication

## Running Smoke Tests Manually

You can run these smoke tests manually against any deployed adapter:

```bash
# Set your adapter URL and bearer token
export ADAPTER_URL="esw-adapter.fly.dev"  # Replace with your adapter hostname
export MCP_SERVER_BEARER="your-token-here"

# Test ping
curl -fsS "https://${ADAPTER_URL}/api/ping" | jq .

# Test discovery
curl -fsS "https://${ADAPTER_URL}/api/mcp-tools" | jq .

# Test realistic query
curl -fsS -X POST "https://${ADAPTER_URL}/api/mcp-tools" \
  -H "Authorization: Bearer $MCP_SERVER_BEARER" \
  -H "Content-Type: application/json" \
  -d '{"action":"tool.call","tool":"doc_search","args":{"q":"rounding","k":3}}' \
  | jq .
```

## Troubleshooting

### 502 Bad Gateway

If you get a 502 error on the POST request, it means the adapter cannot reach the sidecar. Check:
- The `MCP_URL` environment variable in `adapter/fly.toml`
- That the sidecar is running and accessible
- Network connectivity between services

### 401 Unauthorized

The bearer token is incorrect or missing. Verify:
- `MCP_SERVER_BEARER` secret is set in GitHub
- The token matches what's configured in the adapter's environment

### Timeout

If requests time out, check:
- The `MCP_TIMEOUT_MS` setting (default: 15000ms)
- Sidecar response times
- Network latency
