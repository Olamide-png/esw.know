// types/ask-docs.ts
export type AskDocsRequest = {
  question: string
  // Optional scoping:
  path?: string            // e.g. "/shopify/installation/..." (folder or page)
  include?: string[]       // glob-like: ["**/*.md","**/*.mdx"]
  exclude?: string[]       // ["**/drafts/**"]
  maxChars?: number        // cap context to keep costs low (default 12000)
  k?: number               // top-k chunks (default 6)
}

export type AskDocsCitation = {
  title: string
  url?: string
  path: string
  score: number
  chunkId: string
  start: number
  end: number
  preview: string
}

export type AskDocsResponse = {
  answer: string
  citations: AskDocsCitation[]
  usage?: { model: string; promptTokens?: number; completionTokens?: number }
  meta?: { elapsedMs: number; source: "local-fs" | "nuxt-content" | "vector" }
}
