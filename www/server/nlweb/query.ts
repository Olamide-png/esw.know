// www/server/nlweb/query.ts
import { useRuntimeConfig } from '#imports'

type QueryInput = { question: string }
type Source = { name?: string; url: string }
type QueryOutput = { text: string; sources: Source[] }

export async function query({ question }: QueryInput): Promise<QueryOutput> {
  const cfg = useRuntimeConfig()

  // Read from runtimeConfig and fall back to process.env
  const apiKey =
    (cfg as any).openaiApiKey ||
    process.env.OPENAI_API_KEY ||
    ''

  const model =
    (cfg as any).openaiModel ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini'

  if (!apiKey) {
    return {
      text:
        `No OPENAI_API_KEY found. Add it to www/.env.local and restart the dev server.\n` +
        `You asked: "${question}".`,
      sources: []
    }
  }

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const sys = 'You are a concise documentation assistant. Return plain text.'
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Question: ${question}` }
    ],
    temperature: 0.2
  })

  const text =
    completion.choices?.[0]?.message?.content?.trim() ||
    'No answer generated.'

  return { text, sources: [] }
}



