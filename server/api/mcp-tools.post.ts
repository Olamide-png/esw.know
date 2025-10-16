import { defineEventHandler, readBody } from 'h3';

// Proxy POST /api/mcp-tools -> sidecar /ask
const SIDECAR = process.env.MCP_SIDECAR_URL || 'http://127.0.0.1:7015/ask';
const SIDECAR_BEARER = process.env.MCP_SIDECAR_BEARER || '';

export default defineEventHandler(async (event) => {
  const req = event.node.req as IncomingMessage & { headers: Record<string, string> };
  const res = event.node.res as any;
  const accept = String(req.headers.accept || '');
  const wantSSE = accept.includes('text/event-stream');

  const body = await readBody(event);

  const headers: Record<string, string> = {
    'accept': 'text/event-stream',
    'content-type': 'application/json',
  };
  if (SIDECAR_BEARER)
    headers.authorization = `Bearer ${SIDECAR_BEARER}`;

  let upstream: Response;
  try {
    upstream = await fetch(SIDECAR, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    res.statusCode = 502;
    return { ok: false, error: 'upstream_unavailable' };
  }

  // If client asked for SSE, stream the upstream body back as-is
  if (wantSSE) {
    const status = upstream.status || 200;
    res.writeHead(status, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    });
    const reader = upstream.body?.getReader();
    if (!reader)
      return '';
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done)
        break;
      res.write(decoder.decode(value));
    }
    res.end();
    return;
  }

  // Aggregate SSE -> JSON for non-SSE clients
  const text = await upstream.text();
  const messages: any[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:'))
      continue;
    const json = line.slice(5).trim();
    if (!json)
      continue;
    try {
      messages.push(JSON.parse(json));
    } catch (e) {
      // ignore
    }
  }

  const final = messages.find(m => m.message_type === 'final')
    || messages.find(m => m.message_type === 'result')
    || messages.find(m => m.message_type === 'end-nlweb-response')
    || { ok: true, messages };

  res.setHeader('content-type', 'application/json; charset=utf-8');
  return final;
});
