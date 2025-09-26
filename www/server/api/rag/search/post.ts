import { searchRag } from "~/utils/rag"
export default defineEventHandler(async (event) => {
  const body = await readBody<{ query: string; k?: number }>(event)
  if (!body?.query) {
    setResponseStatus(event, 400)
    return { error: "query required" }
  }
  const items = await searchRag(body.query, body.k ?? 8)
  return { items }
})

