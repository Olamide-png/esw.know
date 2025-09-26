<script setup lang="ts">
definePageMeta({ ssr: false })

const query = ref('Where do I configure rounding rules?')
const mode = ref<'generate' | 'list' | 'summarize'>('generate')
const loading = ref(false)
const err = ref<string | null>(null)

const streamedText = ref('')      // final text
const topSources  = ref<any[]>([]) // links

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

<template>
  <div class="mx-auto max-w-3xl p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Ask the Docs</h1>

    <!-- Controls -->
    <div class="space-y-3">
      <label class="block text-sm">Question</label>
      <textarea v-model="query" rows="3" class="w-full rounded border p-3"></textarea>

      <div class="flex items-center gap-3">
        <label class="text-sm">Mode</label>
        <select v-model="mode" class="rounded border p-2">
          <option value="generate">generate</option>
          <option value="list">list</option>
          <option value="summarize">summarize</option>
        </select>

        <button
          @click="ask"
          :disabled="loading"
          class="ml-auto rounded bg-black px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Asking…' : 'Ask' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="err" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
      {{ err }}
    </div>

    <!-- Answer -->
    <div v-if="streamedText" class="space-y-3">
      <h2 class="text-lg font-medium">Answer</h2>
      <div class="prose max-w-none whitespace-pre-wrap">
        {{ streamedText }}
      </div>
    </div>

    <!-- Top Sources -->
    <div v-if="topSources?.length" class="space-y-2">
      <h3 class="text-sm font-medium opacity-70">Top sources</h3>
      <ul class="list-disc pl-5 text-sm">
        <li v-for="(c, i) in topSources" :key="i">
          <a class="underline" :href="c.url" target="_blank">{{ c.name || c.url }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>





