<script setup lang="ts">
definePageMeta({ ssr: false })

const query = ref('Where do I configure rounding rules?')
const mode = ref<'generate'|'list'|'summarize'>('generate')
const loading = ref(false)
const err = ref<string|null>(null)

const streamedText = ref('')      // final text (no SSE now)
const topSources = ref<any[]>([]) // source links
const showDebug = ref(false)

function reset() {
  err.value = null
  streamedText.value = ''
  topSources.value = []
}

async function ask() {
  if (loading.value) return
  reset()
  loading.value = true

  try {
    if (mode.value === 'generate') {
      // -> /api/nlweb/query expects { question }
      const res: any = await $fetch('/api/nlweb/query', {
        method: 'POST',
        body: { question: query.value }
      })

      if (res?.ok) {
        // common fields your core may return
        const data = res.data ?? {}
        streamedText.value =
          data.text ??
          data.answer ??
          data.content ??
          (typeof data === 'string' ? data : JSON.stringify(data, null, 2))
        topSources.value = data.sources ?? data.citation ?? []
      } else {
        throw new Error(res?.error || 'No result')
      }
    } else {
      // -> /api/nlweb/search expects { q }
      const res: any = await $fetch('/api/nlweb/search', {
        method: 'POST',
        body: { q: query.value, mode: mode.value }
      })

      if (res?.ok) {
        const data = res.data ?? {}
        // If your search returns items, render a simple list
        if (Array.isArray(data.items)) {
          streamedText.value =
            'Top items:\n' +
            data.items.map((it: any) => {
              const name = it?.name ?? it?.title ?? it?.url ?? 'item'
              const url  = it?.url ?? it?.link ?? '#'
              return `- [${name}](${url})`
            }).join('\n')
        } else if (Array.isArray(data.results)) {
          streamedText.value =
            'Top items:\n' +
            data.results.map((it: any) => {
              const name = it?.name ?? it?.title ?? it?.url ?? 'item'
              const url  = it?.url ?? it?.link ?? '#'
              return `- [${name}](${url})`
            }).join('\n')
        } else {
          // fallback
          streamedText.value =
            typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        }
        topSources.value = data.sources ?? data.citation ?? []
      } else {
        throw new Error(res?.error || 'No result')
      }
    }
  } catch (e: any) {
    err.value = e?.message || 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>





