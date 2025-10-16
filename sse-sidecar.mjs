import http from 'node:http'

const server = http.createServer((req, res) => {
  if (req.url === '/ask' && req.method === 'POST') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no'
    })
    const now = Date.now()
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)
    send({ message_type: 'begin-nlweb-response', conversation_id: '', query: '', timestamp: now })
    setTimeout(() => send({ message_type: 'intermediate_message', status: 'ok from local sse stub', timestamp: (now/1000), message_id: 'stub#1', conversation_id: '' }), 150)
    setTimeout(() => { send({ message_type: 'end-nlweb-response', conversation_id: '', timestamp: now+500 }); res.end() }, 500)
  } else {
    res.writeHead(404).end()
  }
})

server.listen(7015, '127.0.0.1', () => console.log('SSE stub on http://127.0.0.1:7015/ask'))
