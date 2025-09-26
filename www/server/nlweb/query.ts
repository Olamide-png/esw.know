import { useRuntimeConfig } from '#imports'

type QueryInput = { question: string }
type Source = { name?: string; url: string }
type QueryOutput = { text: string; sources: Source[] }

export async function query({ question }: QueryInput): Promise<QueryOutput> {
  const cfg = useRuntimeConfig()
  const apiKey = cfg.openaiApiKey as string
  const model = (cfg.openaiModel as string) || 'gpt-4o-mini'

  if (!apiKey) {
    // Safe fallback so dev works even without a key
    return {
      text: `Demo answer (no OPENAI_API_KEY set). You asked: "${question}".`,
      sources: []
    }
  }

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const sys = 'You are a concise documentation assistant. Return plain text.'
  const chat = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Question: ${question}` }
    ],
    temperature: 0.2
  })

  const text = chat.choices?.[0]?.message?.content?.trim() || 'No answer generated.'
  return { text, sources: [] }
}


