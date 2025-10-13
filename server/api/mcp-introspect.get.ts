// server/api/mcp-introspect.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/ask'
  const IS_MCP = MCP_URL.endsWith('/mcp')
  const MCP_TIMEOUT_MS = Number(process.env.MCP_TIMEOUT_MS || 15000)
  const SERVER_BEARER = process.env.MCP_SERVER_BEARER || ''
  const SIDECAR_BEARER = process.env.MCP_SIDECAR_BEARER || ''

  return {
    ok: true,
    MCP_URL,
    mode: IS_MCP ? 'jsonrpc' : 'ask-adapter',
    timeout_ms: MCP_TIMEOUT_MS,
    auth: {
      server_bearer_enabled: Boolean(SERVER_BEARER),
      sidecar_bearer_enabled: Boolean(SIDECAR_BEARER),
    },
    // do NOT return actual secrets
  }
})

