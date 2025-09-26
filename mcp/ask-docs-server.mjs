#!/usr/bin/env node
// Works with @modelcontextprotocol/sdk v1.18.x+

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import fetch from "node-fetch"

const ASK_ENDPOINT =
  process.env.ASKDOCS_ENDPOINT || "http://localhost:3000/api/nl/ask"

// 1) Create server (declare we provide tools)
const server = new Server(
  { name: "ask-docs", version: "1.0.0" },
  { capabilities: { tools: {} } }
)

// 2) Tool spec returned via tools/list
const toolSpec = {
  name: "ask_docs",
  description:
    "Ask documentation questions. Returns JSON { answer, citations[], usage?, meta? }.",
  // MCP expects JSON Schema here:
  input_schema: {
    type: "object",
    properties: {
      question: { type: "string" },
      path: { type: "string" },
      include: { type: "array", items: { type: "string" } },
      exclude: { type: "array", items: { type: "string" } },
      maxChars: { type: "number" },
      k: { type: "number" }
    },
    required: ["question"]
  }
}

// 3) tools/list — NOTE: pass the SCHEMA object, not a string
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [toolSpec] }
})

// 4) tools/call — call your Nuxt endpoint and return JSON content
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "ask_docs") {
    throw new Error(`Unknown tool: ${req.params.name}`)
  }

  const args = req.params.arguments ?? {}

  const r = await fetch(ASK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args)
  })

  if (!r.ok) {
    const body = await r.text().catch(() => "")
    throw new Error(`ask_docs failed: ${r.status} ${body}`)
  }

  const json = await r.json()
  return {
    content: [{ type: "json", json }]
  }
})

// 5) Start over stdio
const transport = new StdioServerTransport()
await server.connect(transport)


