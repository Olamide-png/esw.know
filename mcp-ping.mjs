import fetch from 'node-fetch';

const ORIGIN = process.env.MCP_ORIGIN || 'http://localhost:8790';
const TOKEN  = process.env.MCP_TOKEN  || 'dev-secret';

async function callTool(name, payload) {
  const res = await fetch(`${ORIGIN}/tools/${name}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name} ${res.status}: ${text}`);
  }
  return res.json();
}

(async () => {
  console.log('→ docs.search');
  const s = await callTool('docs.search', { query: 'international app', k: 5 });
  console.log(s.items?.slice(0,3) || s);

  console.log('\n→ docs.answer');
  const a = await callTool('docs.answer', { question: 'What is the ESW International App?', k: 5 });
  console.log('Answer:\n', a.answer);
  console.log('\nSources:\n', a.sources);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
