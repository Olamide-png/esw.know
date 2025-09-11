import { defineEventHandler, readBody, createError } from 'h3'
import { $fetch } from 'ofetch'

function isTextLike(ct?: string) {
  if (!ct) return false
  return /(json|text|xml|yaml|csv|html|javascript)/i.test(ct)
}

export default defineEventHandler(async (event) => {
  const { url, method, headers, body } = await readBody<{
    url: string
    method: string
    headers?: Record<string,string>
    body?: any
  }>(event)

  if (!url || !method) throw createError({ statusCode: 400, statusMessage: 'url and method are required' })

  // Outbound host allow-list (set TRYIT_ALLOWED_HOSTS="api.example.com,logistics.example.com")
  const allow = (process.env.TRYIT_ALLOWED_HOSTS || '').split(',').map(s=>s.trim()).filter(Boolean)
  try {
    const { host, protocol } = new URL(url)
    if (allow.length && !allow.includes(host)) {
      throw createError({ statusCode: 403, statusMessage: `Host not allowed: ${host}` })
    }
    if (!/^https?:$/.test(protocol)) {
      throw createError({ statusCode: 400, statusMessage: 'Only http/https are allowed' })
    }
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  const started = Date.now()
  const res = await $fetch.raw(url, {
    method: method as any,
    headers: headers as any,
    body: typeof body === 'string' ? body : (body ? JSON.stringify(body) : undefined),
    retry: 0,
    onResponseError: () => {}
  })
  const timeMs = Date.now() - started

  const hdrs: Record<string,string> = {}
  res.headers.forEach((v,k)=>{ hdrs[k]=v })
  const ct = hdrs['content-type']
  const text = await res.text()
  const size = Buffer.byteLength(text)

  // Cookie parsing left minimal; most Node fetch impls don’t expose a reliable array getter
  const setCookieHeader = res.headers.get('set-cookie') || ''
  const cookies = setCookieHeader ? [{ name: setCookieHeader.split('=')[0], value: setCookieHeader }] : []

  return {
    status: res.status,
    timeMs,
    size,
    headers: hdrs,
    cookies,
    body: isTextLike(ct) ? text : `<${ct || 'binary'}; ${size} bytes>`
  }
})
