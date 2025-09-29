import { defineEventHandler } from 'h3'
export default defineEventHandler(() => ({
  ok: true,
  cwd: process.cwd(),
  env: {
    DATABASE_URL: !!process.env.DATABASE_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || null,
    OPENAI_MODEL: process.env.OPENAI_MODEL || null,
  }
}))



