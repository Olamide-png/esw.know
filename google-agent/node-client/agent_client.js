#!/usr/bin/env node
/*
 Simple Node client to call the adapter and parse either aggregated JSON or SSE streaming responses.
 Usage:
  #!/usr/bin/env node
  /*
   Simple Node client to call the adapter and parse either aggregated JSON or SSE streaming responses.
   Usage:
     node agent_client.js --mode=json
     node agent_client.js --mode=sse
   Ensure environment variable MCP_BEARER is set (or modify the script to use devsecret in .env for testing).
  */
import { argv, env } from 'node:process';

const MODE = argv.includes('--mode=sse') ? 'sse' : 'json';
const URL = globalThis.ADAPTER_URL || env.ADAPTER_URL || 'http://127.0.0.1:3000/api/mcp-tools';
const BEARER = env.MCP_BEARER || 'devsecret';

async function runJson() {
  const body = { action: 'tool.call', tool: 'doc_search', params: { query: 'Rounding Rules', k: 5 } };
  const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': `Bearer ${BEARER}` }, body: JSON.stringify(body) });
  const txt = await r.text();
  try {
    const j = JSON.parse(txt);
    if (j.ok === false)
      return console.error('error', j);
      // aggregated adapter returns either {ok:true,messages:[]} or a direct result envelope
    if (j.messages) {
      console.warn('Aggregated messages:', j.messages.map(m => m.message_type));
      const res = j.messages.find(m => m.message_type === 'result');
      console.warn('result content:', res ? res.content : j.messages);
    } else if (j.message_type === 'result' || j.content) {
      console.warn('direct result:', j.content || j);
    } else {
      console.warn('raw payload:', j);
    }
  } catch {
    console.error('Non-JSON response:', txt);
  }
}

async function runSse() {
  const body = { action: 'tool.call', tool: 'doc_search', params: { query: 'Rounding Rules', k: 5 } };
  const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', 'accept': 'text/event-stream', 'authorization': `Bearer ${BEARER}` }, body: JSON.stringify(body) });
  if (!r.ok) {
    console.error('upstream error', r.status);
    console.error(await r.text());
    return;
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder('utf-8');
  let acc = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done)
      break;
    acc += dec.decode(value, { stream: true });
    let idx = acc.indexOf('\n');
    while (idx !== -1) {
      const line = acc.slice(0, idx).trim();
      acc = acc.slice(idx + 1);
      idx = acc.indexOf('\n');
      if (!line.startsWith('data:'))
        continue;
      const json = line.slice(5).trim();
      if (!json)
        continue;
      try {
        const obj = JSON.parse(json);
        console.warn('SSE envelope:', obj.message_type || '(no type)');
        if (obj.message_type === 'result') {
          console.warn('RESULT content:', obj.content);
        }
      } catch {
        console.error('malformed json in sse:', json.slice(0, 200));
      }
    }
  }
}

(async () => {
  if (MODE === 'sse')
    await runSse(); else await runJson();
})().catch((err) => {
  console.error(err);
  throw err;
});
