import { Client } from "pg"

export default defineEventHandler(async () => {
  const out: any = {
    node: process.version,
    hasEnv: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      OPENAI_MODEL:   !!process.env.OPENAI_MODEL,
      EMBED_MODEL:    !!process.env.EMBED_MODEL,
      DATABASE_URL:   !!process.env.DATABASE_URL,
    },
    time: new Date().toISOString(),
  }

  try {
    const c = new Client({ connectionString: process.env.DATABASE_URL })
    await c.connect()
    out.dbConnect = "ok"

    const t = await c.query(`SELECT to_regclass('public.rag_chunks') AS exists`)
    out.ragChunksTable = t.rows[0]?.exists

    const e = await c.query(`SELECT extname FROM pg_extension WHERE extname='vector'`)
    out.pgvector = e.rowCount ? "installed" : "missing"

    const d = await c.query(`SELECT vector_dims(embedding) AS dims FROM rag_chunks LIMIT 1`)
    out.exampleDims = d.rows[0]?.dims ?? null

    await c.end()
  } catch (err: any) {
    // unwrap AggregateError and common pg network fields
    const details: any = { message: err?.message, name: err?.name, code: err?.code }
    if (err?.errors && Array.isArray(err.errors)) {
      details.inner = err.errors.map((e: any) => ({
        message: e?.message, code: e?.code, errno: e?.errno, address: e?.address, port: e?.port, stack: e?.stack
      }))
    }
    if (err?.stack) details.stack = err.stack
    out.dbError = details
  }

  return out
})


