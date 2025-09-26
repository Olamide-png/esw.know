import { useRuntimeConfig } from '#imports'

type QueryInput = { question: string }
type Source = { name?: string; url: string }
type QueryOutput = { text: string; sources: Source[] }

export async function query({ question }: QueryInput): Promise<QueryOutput> {
  const cfg = useRuntimeConfig()
  const apiKey = cfg.openaiApiKey as string
  const model = (cfg.openaiModel as string) || 'gpt-4o-mini'

  // If no key, return a safe fallback so builds never crash.
  if (!apiKey) {
    return {
      text: `Demo answer (no OPENAI_API_KEY set). You asked: "${question}".`,
      sources: []
    }
  }

  // Lazy import so the module isn't loaded at build time
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const sys = `You are a concise documentation assistant. Cite nothing unless you are sure; return plain text.`
  const user = `Question: ${question}`

  const chat = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    temperature: 0.2
  })

  const text =
    chat.choices?.[0]?.message?.content?.trim() ||
    'No answer generated.'

  // If you later add retrieval, populate real URLs here.
  const sources: Source[] = []

  return { text, sources }
}

