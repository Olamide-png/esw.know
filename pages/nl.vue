<script setup lang="ts">
const query = ref('Where do I configure rounding rules?')
const mode = ref<'generate'|'list'|'summarize'>('generate') // default generate ✅
const loading = ref(false)
const err = ref<string|null>(null)

// streaming state
const streamedText = ref('')            // live tokens append here
const topSources = ref<any[]>([])       // shown immediately
const showDebug = ref(false)

function reset() {
  err.value = null
  streamedText.value = ''
  topSources.value = []
}

// Simple SSE line parser
function parseSSE(chunk: string, onEvent: (ev: string, data: any) => void) {
  // Split on event frames separated by blank lines
  const frames = chunk.split(/\n\n+/)
  for (const frame of frames) {
    if (!frame.trim()) continue
    const lines = frame.split('\n')
    let ev = 'message'
    let data = ''
    for (const line of lines) {
      if (line.startsWith('event:')) ev = line.slice(6).trim()
      else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trim()
    }
    if (data) {
      try { onEvent(ev, JSON.parse(data)) }
      catch { onEvent(ev, data) }
    }
  }
}

async function ask() {
  if (loading.value) return           // debounce ✅
  reset()
  loading.value = true

  try {
    // If user selected non-stream modes you can still call the old /api/nl/ask
    // Here we stream only for "generate" (best UX)
    if (mode.value !== 'generate') {
      const res = await $fetch('/api/nl/ask', {
        method: 'POST',
        body: { query: query.value, mode: mode.value }
      })
      // mimic the display shape
      if (res?.['@type'] === 'Answer') {
        streamedText.value = res.text || ''
        topSources.value = res.citation || []
      } else if (res?.['@type'] === 'ItemList') {
        streamedText.value = 'Top items:\n' + (res.itemListElement || [])
          .map((it: any) => `- [${it.item?.name}](${it.item?.url})`).join('\n')
      } else {
        streamedText.value = 'No result.'
      }
      return
    }

    const resp = await fetch('/api/nl/ask-stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: query.value })
    })

    if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`)

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // Consume complete frames; keep any trailing partial in buf
      const lastDoubleNewline = buf.lastIndexOf('\n\n')
      if (lastDoubleNewline >= 0) {
        const chunk = buf.slice(0, lastDoubleNewline + 2)
        buf = buf.slice(lastDoubleNewline + 2)
        parseSSE(chunk, (ev, data) => {
          if (ev === 'sources') {
            topSources.value = data
          } else if (ev === 'delta') {
            streamedText.value += String(data)
          } else if (ev === 'error') {
            err.value = String(data)
          }
          // ev === 'done' is ignored here; we already have sources
        })
      }
    }

    // flush any trailing data
    if (buf) {
      parseSSE(buf, (ev, data) => {
        if (ev === 'delta') streamedText.value += String(data)
      })
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
      <textarea v-model="query" rows="3" class="w-full rounded border p-3" />

      <div class="flex items-center gap-3">
        <label class="text-sm">Mode</label>
        <select v-model="mode" class="rounded border p-2">
          <option value="generate">generate</option>
          <option value="list">list</option>
          <option value="summarize">summarize</option>
        </select>

      <!-- Debounced: disabled while loading ✅ -->
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

    <!-- Top Sources panel (appears immediately) ✅ -->
    <div v-if="topSources?.length" class="space-y-2">
      <h3 class="text-sm font-medium opacity-70">Top sources</h3>
      <ul class="list-disc pl-5 text-sm">
        <li v-for="(c, i) in topSources" :key="i">
          <a class="underline" :href="c.url" target="_blank">{{ c.name || c.url }}</a>
        </li>
      </ul>
    </div>

    <!-- Optional: Debug -->
    <details>
      <summary>Debug JSON</summary>
      <pre class="text-xs whitespace-pre-wrap">{{ { topSources, streamedText } }}</pre>
    </details>
  </div>
</template>




