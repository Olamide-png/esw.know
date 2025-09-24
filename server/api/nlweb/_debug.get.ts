// server/api/nlweb/_debug.get.ts
export default defineEventHandler(() => {
  const { nlwebBaseUrl } = useRuntimeConfig()
  return { nlwebBaseUrl }
})
