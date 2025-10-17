import { Buffer } from 'node:buffer';
// adapter-server.mjs  (drop-in)
// node adapter-server.mjs
import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT || 3000);
// Point straight at the sidecar /ask (sidecar understands action:"tool.call")
const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/ask';
const MCP_SERVER_BEARER = process.env.MCP_SERVER_BEARER || '';
const MCP_SIDECAR_BEARER = process.env.MCP_SIDECAR_BEARER || '';
const MCP_TIMEOUT_MS = Number(process.env.MCP_TIMEOUT_MS || 15000);

// tiny utils
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      try { resolve(JSON.parse(buf.toString('utf8') || '{}')); } catch { resolve({}); }
    });
  });
}

async function* sseJsonIterator(stream) {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done)
      break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, i).trimEnd();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:'))
        continue;
      const json = line.slice(5).trimStart();
      if (!json)
        continue;
      try { yield JSON.parse(json); } catch {}
    }
  }
}

function json(res, code, obj) {
  const body = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // ── /api/ping ────────────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/ping') {
    return json(res, 200, { ok: true, ts: Date.now() });
  }

  // ── /api/mcp-tools (static discovery) ───────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/mcp-tools') {
    return json(res, 200, {
      ok: true,
      tools: [
        { name: 'doc_lookup', title: 'Lookup a local doc by path' },
        { name: 'doc_search', title: 'Search docs (semantic/keyword)' },
        { name: 'doc_extract', title: 'Extract full text of a doc by path' },
      ],
    });
  }

  // ── /api/mcp  (pure pass-through, NO adapting)
  // Also accept POSTs at /api/mcp-tools so this adapter can be used as a
  // stable origin for the public path that Cloudflare Tunnel maps to.
  if (req.method === 'POST' && (url.pathname === '/api/mcp' || url.pathname === '/api/mcp-tools')) {
    // optional gateway auth
    if (MCP_SERVER_BEARER) {
      const auth = req.headers.authorization || '';
      if (auth !== `Bearer ${MCP_SERVER_BEARER}`) {
        return json(res, 401, { ok: false, error: 'unauthorized' });
      }
    }

    const accept = String(req.headers.accept || '').toLowerCase();
    const wantSSE = accept.includes('text/event-stream');
    const body = await readBody(req);

    // forward as-is to the sidecar /ask
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

    let upstream;
    try {
      upstream = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
          'accept': 'text/event-stream',
          'content-type': 'application/json',
          ...(MCP_SIDECAR_BEARER ? { authorization: `Bearer ${MCP_SIDECAR_BEARER}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      return json(res, 502, { ok: false, error: 'upstream_unavailable' });
    }
    clearTimeout(timer);

    // SSE passthrough
    if (wantSSE) {
      res.writeHead(upstream.status, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'x-mcp-url': MCP_URL,
        'x-mcp-timeout-ms': String(MCP_TIMEOUT_MS),
      });
      const stream = upstream.body;
      if (!stream)
        return res.end();
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done)
          break;
        res.write(Buffer.isBuffer(value) ? value : Buffer.from(value));
      }
      return res.end();
    }

    // Aggregate SSE → JSON for non-SSE callers
    const messages = [];
    for await (const m of sseJsonIterator(upstream.body)) messages.push(m);
    const final
      = messages.find(m => m.message_type === 'final')
        || messages.find(m => m.message_type === 'result')
        || messages.find(m => m.message_type === 'end-nlweb-response')
        || { ok: true, messages };
    res.setHeader('x-mcp-url', MCP_URL);
    res.setHeader('x-mcp-timeout-ms', String(MCP_TIMEOUT_MS));
    return json(res, 200, final);
  }

  // not found
  return json(res, 404, { ok: false, error: 'not_found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.warn(`adapter listening on http://0.0.0.0:${PORT}`);
});
