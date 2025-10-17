Node test harness for adapter (ESW Know)

This small script demonstrates calling the adapter `POST /api/mcp-tools` and parsing either aggregated JSON or SSE streaming responses.

Quick test commands (run locally before pointing Google Agent Space to the adapter):

JSON (aggregated):

```bash
MCP_BEARER=devsecret node agent_client.js --mode=json
```

SSE (streaming):

```bash
MCP_BEARER=devsecret node agent_client.js --mode=sse
```

See `../AGENT_SPACE_INSTRUCTIONS.md` for the full checklist and Agent Studio configuration.
