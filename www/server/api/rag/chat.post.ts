import { answerRag } from "~/utils/rag"
export default defineEventHandler(async (event) => {
  const body = await readBody<{ question: string; k?: number; history?: any[] }>(event)
  if (!body?.question) {
    setResponseStatus(event, 400)
    return { error: "question required" }
  }
  const { answer, sources } = await answerRag(body.question, body.k ?? 8, body.history ?? [])
  return { answer, sources }
})

