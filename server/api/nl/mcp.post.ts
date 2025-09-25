import { defineEventHandler, readBody } from 'h3'
import { handleAsk } from '../../nlweb/core'

type RpcReq = {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export default defineEventHandler(async (event) => {
  const req = await readBody<RpcReq>(event)

  if (req.method === 'tools/list') {
    return {
      jsonrpc: '2.0', id: req.id, result: {
        tools: [
          { name: 'ask', description: 'Ask the docs',
            inputSchema: { type: 'object', properties: {
              query: { type: 'string' },
              mode: { type: 'string', enum: ['generate','list','summarize'] },
              k: { type: 'number' }
            }, required: ['query'] } }
        ]
      }
    }
  }

  if (req.method === 'call/ask') {
    const { query, mode, k } = req.params || {}
    const out = await handleAsk({ query, mode, k })
    return { jsonrpc: '2.0', id: req.id, result: out }
  }

  return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'Method not found' } }
})
