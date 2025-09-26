// server/api/nlweb/[...path].ts
export const runtime = 'node' // force Node (not Edge)

import { defineEventHandler, readBody, setResponseHeader, getRouterParam, createError } from 'h3'

// Eagerly include every module in server/nlweb/** so Nitro bundles them for prod
const nlwebModules = import.meta.glob('~/server/nlweb/**/*.ts', { eager: true }) as Record<
  string,
  { default?: Function; handler?: Function }
>

// Build a registry like: "rag/run" -> exported function from server/nlweb/rag/run.ts
const registry = new Map<string, Function>()
for (const [file, mod] of Object.entries(nlwebModules)) {
  const key = file.split('/server/nlweb/')[1].replace(/\.ts$/, '')
  const fn = mod.default || mod.handler
  if (typeof fn === 'function') registry.set(key, fn)
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const raw = getRouterParam(event, 'path') || ''
  const key = raw.split('/').filter(Boolean).join('/')

  if (!key) throw createError({ statusCode: 404, statusMessage: 'Missing nlweb action' })

  const fn = registry.get(key)
  if (!fn) {
    throw createError({ statusCode: 404, statusMessage: `Unknown nlweb action: ${key}` })
  }

  const method = (event.method || 'GET').toUpperCase()
  const input = /^(POST|PUT|PATCH)$/.test(method) ? await readBody(event) : {}

  // Call your implementation: export default async function (input, event) { ... }
  return await fn(input, event)
})
