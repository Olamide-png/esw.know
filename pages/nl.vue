<!-- pages/nl.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const path = ref('/shopify/installation/apps') // try any route under /pages
const question = ref('What does this page cover?')
const busy = ref(false)
const result = ref<any>(null)
const err = ref<string>('')

const canAsk = computed(() => !!path.value && path.value.startsWith('/') && !busy.value)

// Derive values even if API omits them
const derivedMode = computed(() => {
  if (!result.value) return '(unknown)'
  // If server forgot "mode", infer: presence of answer => qa, else context-only
  return result.value.mode || (result.value.answer ? 'qa' : 'context-only')
})

const derivedUrl = computed(() => {
  if (result.value?.url) return result.value.url
  try {
    // Fallback: reconstruct from current origin + path input
    if (path.value?.startsWith('/')) return new URL(path.value, window.location.origin).toString()
  } catch {}
  return '(n/a)'
})

async function ask() {
  if (!canAsk.value) return
  busy.value = true
  err.value = ''
  try {
    const res = await $fetch('/api/nl/ask', {
      method: 'POST',
      body: { path: path.value, question: question.value, maxChars: 12000 }
    })
    result.value = res
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Unknown error'
  } finally {
    busy.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    ask()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 space-y-6">
    <h1 class="text-2xl font-semibold">Ask this site</h1>

    <div class="grid gap-3">
      <label class="text-sm font-medium">Page path (relative)</label>
      <input
        v-model="path"
        class="w-full rounded-md border px-3 py-2 bg-background"
        placeholder="/docs/getting-started"
        :class="{'border-red-500': path && !path.startsWith('/')}"
      />
      <p v-if="path && !path.startsWith('/')" class="text-xs text-red-500">
        Path must start with “/”.
      </p>
    </div>

    <div class="grid gap-3">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">Your question</label>
        <span class="text-xs opacity-60">Press Ctrl/⌘ + Enter to ask</span>
      </div>
      <textarea
        v-model="question"
        rows="3"
        class="w-full rounded-md border px-3 py-2 bg-background"
        placeholder="What does this page cover?"
      />
    </div>

    <button
      :disabled="!canAsk"
      @click="ask"
      class="inline-flex items-center gap-2 rounded-xl px-4 py-2 border shadow-sm disabled:opacity-60"
    >
      <span v-if="busy" class="i-lucide-loader animate-spin" aria-hidden="true"></span>
      {{ busy ? 'Thinking…' : 'Ask' }}
    </button>

    <p v-if="err" class="text-red-500 text-sm">{{ err }}</p>

    <div v-if="result" class="rounded-xl border p-4 space-y-4">
      <div class="text-xs opacity-70">
        Mode: {{ derivedMode }} • URL: {{ derivedUrl }}
      </div>

      <!-- Helpful banner for context-only scenarios -->
      <div
        v-if="derivedMode === 'context-only'"
        class="rounded-md border-l-4 p-3 text-xs border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200"
      >
        Model answering appears disabled (missing <code>OPENAI_API_KEY</code>, <code>DEMO_MODE=true</code>, or empty question).
        You’ll still see extracted context below.
      </div>

      <!-- Answer (when present) -->
      <div v-if="result.answer">
        <h2 class="text-lg font-semibold mb-2">Answer</h2>
        <pre class="whitespace-pre-wrap text-sm">{{ result.answer }}</pre>
      </div>

      <!-- Context -->
      <details open>
        <summary class="cursor-pointer">Context</summary>
        <pre class="mt-2 whitespace-pre-wrap text-xs">{{ result.context ?? result.contextPreview ?? '(no context returned)' }}</pre>
      </details>

      <!-- Debug (raw JSON payload) -->
      <details>
        <summary class="cursor-pointer text-xs opacity-70">Debug payload</summary>
        <pre class="mt-2 whitespace-pre-wrap text-xs">{{ JSON.stringify(result, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>


