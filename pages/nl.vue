<!-- pages/nl.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const path = ref('/');       // try any route under /pages
const question = ref('What does this page cover?');
const busy = ref(false);
const result = ref<any>(null);
const err = ref<string>('')

async function ask() {
  busy.value = true
  err.value = ''
  result.value = null
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
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 space-y-6">
    <h1 class="text-2xl font-semibold">Ask this site</h1>

    <div class="grid gap-3">
      <label class="text-sm font-medium">Page path (relative)</label>
      <input v-model="path" class="w-full rounded-md border px-3 py-2 bg-background" placeholder="/docs/getting-started" />
    </div>

    <div class="grid gap-3">
      <label class="text-sm font-medium">Your question</label>
      <textarea v-model="question" rows="3" class="w-full rounded-md border px-3 py-2 bg-background" />
    </div>

    <button :disabled="busy" @click="ask" class="rounded-xl px-4 py-2 border shadow-sm">
      {{ busy ? 'Thinking…' : 'Ask' }}
    </button>

    <p v-if="err" class="text-red-500 text-sm">{{ err }}</p>

    <div v-if="result" class="rounded-xl border p-4 space-y-4">
      <div class="text-xs opacity-70">Mode: {{ result.mode }} • URL: {{ result.url }}</div>

      <div v-if="result.answer">
        <h2 class="text-lg font-semibold mb-2">Answer</h2>
        <pre class="whitespace-pre-wrap text-sm">{{ result.answer }}</pre>
      </div>

      <details>
        <summary class="cursor-pointer">Context</summary>
        <pre class="mt-2 whitespace-pre-wrap text-xs">{{ result.context ?? result.contextPreview }}</pre>
      </details>
    </div>
  </div>
</template>
