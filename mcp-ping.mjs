#!/usr/bin/env node
import fetch from "node-fetch";

const ORIGIN = process.env.MCP_ORIGIN || "http://localhost:8790";
const TOKEN = (process.env.MCP_TOKEN || "").trim(); // no default

const headers = { "content-type": "application/json" };
if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;

const urls = [`${ORIGIN}/health`, `${ORIGIN}/schema`];

for (const url of urls) {
  try {
    const r = await fetch(url, { headers });
    const text = await r.text();
    console.log(`# ${url}`);
    console.log(text);
  } catch (e) {
    console.error(`# ${url} -> ${e?.message || e}`);
  }
}

