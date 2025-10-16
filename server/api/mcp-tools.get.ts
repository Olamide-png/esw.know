// server/api/mcp-tools.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return {
    ok: true,
    tools: [
      {
        name: 'doc_lookup',
        title: 'Lookup a local doc by path',
        description: 'Returns the best-matching documentation item for a given path and optional query.',
        input_schema: {
          type: 'object',
          required: ['path'],
          properties: {
            path: { type: 'string', description: 'Doc path or slug, e.g. /docs/pricing-advisor' },
            query: { type: 'string', description: 'User question or short query (optional)' },
          },
          additionalProperties: false,
        },
        examples: [
          {
            action: 'tool.call',
            tool: 'doc_lookup',
            params: { path: '/docs/pricing-advisor', query: 'What does this page cover?' },
          },
        ],
      },
      {
        name: 'doc_search',
        title: 'Search docs (semantic/keyword)',
        description: 'Search across the documentation using vector/keyword matching. Returns top-k items.',
        input_schema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'Search query' },
            k: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              default: 5,
              description: 'Number of results to return (default 5)',
            },
          },
          additionalProperties: false,
        },
        examples: [
          {
            action: 'tool.call',
            tool: 'doc_search',
            params: { query: 'rounding rules for JPY', k: 3 },
          },
        ],
      },
      {
        name: 'doc_extract',
        title: 'Extract full text of a doc by path',
        description:
          'Returns the raw text of a documentation page by path. Useful after doc_lookup to pull the content agents can quote or analyze.',
        input_schema: {
          type: 'object',
          required: ['path'],
          properties: {
            path: { type: 'string', description: 'Doc path or slug, e.g. /docs/pricing-advisor' },
            max_chars: {
              type: 'integer',
              minimum: 100,
              maximum: 20000,
              default: 12000,
              description: 'Maximum characters of text to return (default 12000)',
            },
          },
          additionalProperties: false,
        },
        examples: [
          {
            action: 'tool.call',
            tool: 'doc_extract',
            params: { path: '/docs/pricing-advisor', max_chars: 16000 },
          },
        ],
      },
      {
        name: 'ask_llm',
        title: 'Ask across docs (RAG)',
        description: 'Search docs, extract context, and synthesize an answer with an LLM. Returns an answer plus sources.',
        input_schema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'User question' },
            k: { type: 'integer', minimum: 1, maximum: 10, default: 4, description: 'Top-K documents to retrieve' },
            max_chars_per_doc: {
              type: 'integer',
              minimum: 500,
              maximum: 20000,
              default: 4000,
              description: 'Max characters pulled from each doc',
            },
            llm: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', default: true },
                model: { type: 'string', default: 'gpt-4o-mini' },
              },
            },
          },
          additionalProperties: false,
        },
        examples: [
          {
            action: 'tool.call',
            tool: 'ask_llm',
            params: { query: 'How do I compute shopper price with Pricing Advisor?', k: 3 },
          },
        ],
      },
    ],
  }
})



