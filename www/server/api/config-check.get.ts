export default defineEventHandler(() => {
  const { openaiApiKey, openaiModel } = useRuntimeConfig()
  return {
    // never return full secrets
    openaiApiKeySeen: Boolean(openaiApiKey),
    openaiModel,
  }
})
