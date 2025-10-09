#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("name",   { type: "string", describe: "Tool name to call" })
  .option("args",   { type: "string", default: "{}", describe: "JSON string of tool args" })
  .option("tools",  { type: "boolean", default: false, describe: "List tools and exit" })
  // allow overriding the server command for testing
  .option("server",     { type: "string", default: "node" })
  .option("serverArgs", { type: "string", default: '["agents/mcp-server.mjs"]' })
  .parse();

const transport = new StdioClientTransport({
  command: argv.server,
  args: JSON.parse(argv.serverArgs),
  env: { ...process.env }, // passes RAG_API_BASE through
});

const client = new Client({ name: "local-test", version: "0.0.3" }, { capabilities: {} });

// generous timeout
const controller = new AbortController();
const timeoutMs = Number(process.env.MCP_CALL_TIMEOUT_MS || 60000);
const tHandle = setTimeout(() => controller.abort(), timeoutMs);

try {
  await client.connect(transport);

  if (argv.tools) {
    const res = await client.listTools();
    console.log("== TOOLS ==");
    for (const t of res.tools || []) console.log("-", t.name);
    clearTimeout(tHandle);
    await client.close();
    process.exit(0);
  }

  if (!argv.name) throw new Error(`--name is required (use --tools to see available)`);

  const args = JSON.parse(argv.args || "{}");
  const res = await client.callTool(argv.name, args, { signal: controller.signal });
  clearTimeout(tHandle);

  const text = (res?.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  console.log(text || "(no text)");
  await client.close();
} catch (e) {
  clearTimeout(tHandle);
  console.error("[client] error:", e?.message || e);
  process.exitCode = 1;
}











