#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/transports/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Point this at your Nuxt app that serves /api/rag/*
const SITE = process.env.SITE_ORIGIN || "http://localhost:3000";

async function postJson(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  const ok = r.ok;
  try { return { ok, json: JSON.parse(text) }; } catch { return { ok, json: text }; }
}

const server = new Server(
  { name: "esw-docs-stdio", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Tool: docs.search
server.tool("docs.search", {
  description: "Search ESW docs and return ranked hits.",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" }, k: { type: "integer" } },
    required: ["query"]
  },
  handler: async ({ query, k }) => {
    const r = await postJson(`${SITE}/api/rag/search`, { query, k });
    if (!r.ok) throw new Error(JSON.stringify(r.json));
    return { content: [{ type: "json", json: r.json }] };
  }
});

// Tool: docs.answer
server.tool("docs.answer", {
  description: "Answer a question using ESW docs with citations.",
  inputSchema: {
    type: "object",
    properties: {
      question: { type: "string" },
      k: { type: "integer" },
      history: {
        type: "array",
        items: {
          type: "object",
          properties: { role: { type: "string" }, content: { type: "string" } },
          required: ["role","content"]
        }
      }
    },
    required: ["question"]
  },
  handler: async ({ question, k, history }) => {
    const r = await postJson(`${SITE}/api/rag/chat`, { question, k, history });
    if (!r.ok) throw new Error(JSON.stringify(r.json));
    return { content: [{ type: "json", json: r.json }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
