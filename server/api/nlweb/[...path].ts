// server/api/nlweb/[...path].ts
import { defineEventHandler, readBody, getMethod, setHeader, createError } from 'h3'

// Import your concrete handlers directly (no glob)
import * as Query from '~/server/nlweb/query'
import * as Search from '~/server/nlweb/search'

// Normalise to a callable (default export or named)
const toFn = (m: any) => m?.default || m?.handler || m?.run || m?.query || m?.search

const handlers: Record<string, (body: any, event: any) => Promise<any>> = {
  query: toFn(Query),
  search: toFn(Search),
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const parts = (event.context.params?.path as string[] | undefined) || []
  const name = parts[0]
  const fn = name ? handlers[name] : undefined

  if (!fn) {
    throw createError({ statusCode: 404, statusMessage: `Unknown nlweb route: ${name}` })
  }

  const body = await readBody(event)
  setHeader(event, 'Cache-Control', 'no-store')

  return await fn(body, event)
})

