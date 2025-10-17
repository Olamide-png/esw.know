import { env } from 'node:process';

export const config = { runtime: 'edge' };

const MCP_URL = env.MCP_URL || 'http://127.0.0.1:7015/ask';
const MCP_SERVER_BEARER = env.MCP_SERVER_BEARER || '';
const MCP_SIDECAR_BEARER = env.MCP_SIDECAR_BEARER || '';

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

async function sseAggregate(upstream) {
  const messages = [];
  const reader = upstream.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done)
      break;
    buf += dec.decode(value, { stream: true });
    let i = buf.indexOf('\n');
    while (i !== -1) {
      const line = buf.slice(0, i).trimEnd();
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) {
        const json = line.slice(5).trimStart();
        if (json) {
          try { messages.push(JSON.parse(json)); } catch { }
        }
      }
      i = buf.indexOf('\n');
    }
  }
  const final = messages.find(m => m.message_type === 'final')
    || messages.find(m => m.message_type === 'result')
    || messages.find(m => m.message_type === 'end-nlweb-response')
    || { ok: true, messages };
  return final;
}

export default async function handler(req) {
  const url = new URL(req.url);

  if (req.method === 'GET' && url.pathname === '/api/mcp-tools') {
    return jsonResponse({ ok: true, tools: [
      { name: 'doc_lookup', title: 'Lookup a local doc by path' },
      { name: 'doc_search', title: 'Search docs (semantic/keyword)' },
      { name: 'doc_extract', title: 'Extract full text of a doc by path' },
    ] });
  }

  if (req.method !== 'POST' || url.pathname !== '/api/mcp-tools')
    return jsonResponse({ ok: false, error: 'not_found' }, 404);

  if (MCP_SERVER_BEARER) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${MCP_SERVER_BEARER}`) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
    }
  }

  const accept = String(req.headers.get('accept') || '').toLowerCase();
  const wantSSE = accept.includes('text/event-stream');
  let body;
  try { body = await req.json(); } catch { body = {}; }

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
      // note: AbortController not available in all edge runtimes; rely on platform timeout
    });
  } catch {
    return jsonResponse({ ok: false, error: 'upstream_unavailable' }, 502);
  }

  if (wantSSE) {
    // passthrough streaming response
    const headers = new Headers(upstream.headers);
    headers.set('content-type', 'text/event-stream; charset=utf-8');
    headers.set('cache-control', 'no-cache, no-transform');
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  // aggregate SSE -> JSON for non-streaming callers
  const final = await sseAggregate(upstream);
  return jsonResponse(final, 200);
}
