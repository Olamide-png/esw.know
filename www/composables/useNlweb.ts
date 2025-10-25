// composables/useNlweb.ts
export function useNlweb() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function ask(params: { query: string; [k: string]: any }) {
    pending.value = true
    error.value = null
    try {
      const res: any = await $fetch('/api/nlweb/ask', { method: 'POST', body: params })
      if (res?.itemListElement?.map) return res.itemListElement.map((x: any) => x.item || x)
      if (Array.isArray(res?.items)) return res.items
      if (Array.isArray(res)) return res
      if (res && typeof res === 'object') return [res]
      return []
    } catch (e: any) {
      const details = typeof e?.data === 'string'
        ? e.data
        : e?.data
          ? JSON.stringify(e.data)
          : ''
      error.value = `${e?.statusMessage || e?.message || 'Request failed'} ${details ? '→ ' + details : ''}`
      return []
    } finally {
      pending.value = false
    }
  }

  return { ask, pending, error }
}


