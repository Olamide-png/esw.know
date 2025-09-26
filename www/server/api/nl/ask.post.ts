import { defineEventHandler, readBody } from 'h3'
import { query as runQuery } from '@/server/nlweb/query'
import { search as runSearch } from '@/server/nlweb/search'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    query: string
    mode?: 'generate' | 'list' | 'summarize'
  }>(event)

  const question = body?.query?.trim()
  const mode = (body?.mode || 'generate') as 'generate'|'list'|'summarize'

  if (!question) {
    event.node.res.statusCode = 400
    return { error: 'Missing query' }
  }

  if (mode === 'generate' || mode === 'summarize') {
    // Call your nlweb generator
    const res = await runQuery({ question, mode })
    // return in the shape your nl.vue expects
    return {
      '@type': 'Answer',
      text: res?.text || '',
      citation: res?.citation || []
    }
  }

  // mode === 'list'
  const res = await runSearch({ q: question, mode })
  return {
    '@type': 'ItemList',
    itemListElement: (res?.items || []).map((it: any, i: number) => ({
      position: i + 1,
      item: { name: it.title || it.name || it.url, url: it.url }
    }))
  }
})
