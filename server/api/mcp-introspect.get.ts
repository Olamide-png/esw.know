// server/api/mcp-introspect.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/mcp'
  const mode = MCP_URL.endsWith('/mcp') ? 'jsonrpc' : MCP_URL.endsWith('/ask') ? 'ask-adapter' : 'unknown'
  return { ok: true, MCP_URL, mode }
})
