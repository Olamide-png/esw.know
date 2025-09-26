// www/server/nlweb/query.ts
import { useRuntimeConfig } from '#imports'

type QueryInput = { question: string }
type Source = { name?: string; url?: string; file_id?: string; quote?: string }
type QueryOutput = { text: string; sources: Source[] }

function uniqBy<T, K extends string>(arr: T[], key: (x: T) => K) {
  const seen = new Set<K>()
  const out: T[] = []
  for (const x of arr) {
    const k = key(x)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(x)
    }
  }
  return out
}

export async function query({ question }: QueryInput): Promise<QueryOutput> {
  const cfg = useRuntimeConfig()
  const apiKey = (cfg.openaiApiKey as string) || process.env.OPENAI_API_KEY
  const model =
    (cfg.openaiModel as string) ||
    process.env.OPENAI_MODEL ||
    'gpt-4.1-mini'
  const vectorStoreId =
    process.env.VECTOR_STORE_ID ||
    (cfg as any).vectorStoreId // in case you later expose via runtime

  if (!apiKey) {
    // Safe fallback so local dev still renders
    return {
      text:
        `Demo answer (no OPENAI_API_KEY set). You asked: "${question}".` +
        (vectorStoreId ? ' (VECTOR_STORE_ID is set).' : ''),
      sources: []
    }
  }

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  // Small, helpful system prompt
  const system =
    'You are a helpful documentation assistant. ' +
    'Use the provided file search results from the vector store to answer. ' +
    'Prefer direct, specific instructions and include details from the docs. ' +
    'If the answer is not in the docs, say so briefly.'

  // Build the request; attach file_search only if we have a vector store
  const base: any = {
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: question }
    ],
    temperature: 0.2
  }

  if (vectorStoreId) {
    base.attachments = [
      {
        // Tell the Responses API to use our vector store
        file_search: {
          vector_store_ids: [vectorStoreId],
          max_num_results: 8
        }
      }
    ]
  }

  // ---- Call OpenAI Responses API
  const resp: any = await openai.responses.create(base)

  // Text
  const text: string =
    resp.output_text ??
    resp?.output?.map((o: any) => o?.content?.[0]?.text?.value).join('\n') ??
    resp?.choices?.[0]?.message?.content?.trim() ??
    'No answer generated.'

  // Try to pull citations/annotations if present (structure varies by SDK)
  const sources: Source[] = []
  try {
    const blocks = Array.isArray(resp.output) ? resp.output : []
    for (const b of blocks) {
      const parts = Array.isArray(b.content) ? b.content : []
      for (const p of parts) {
        const anns = Array.isArray(p?.annotations) ? p.annotations : []
        for (const a of anns) {
          if (a?.file_citation?.file_id) {
            sources.push({
              file_id: a.file_citation.file_id,
              quote: a.file_citation?.quote,
              // there isn’t a public URL for OpenAI files; keep a label
              name: a.file_citation?.quote?.slice(0, 80) || a.file_citation.file_id
            })
          }
          if (a?.url) {
            sources.push({ url: a.url, name: a.url })
          }
        }
      }
    }
  } catch {
    // best-effort; keep going
  }

  return {
    text,
    sources: uniqBy(sources, s => (s.url || s.file_id || s.name || '') as string)
  }
}




