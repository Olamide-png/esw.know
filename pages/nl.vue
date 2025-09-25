<script setup lang="ts">
import { ref, computed } from 'vue'
import MdText from '~/components/MdText.vue'
import NlwebCard from '~/components/NlwebCard.vue'

const mode = ref<'generate'|'list'|'summarize'>('generate')
const query = ref('Where do I configure rounding rules?')
const busy = ref(false)
const err = ref<string>('')
const result = ref<any>(null)

const isAnswer = computed(() => result.value?.['@type'] === 'Answer')
const isList = computed(() => result.value?.['@type'] === 'ItemList')
const answerText = computed(() => result.value?.text || result.value?.content || '')

async function ask() {
  busy.value = true
  err.value = ''
  result.value = null
  try {
    result.value = await $fetch('/api/nl/ask', { method: 'POST', body: { query: query.value, mode: mode.value } })
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Unknown error'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 space-y-6">
    <h1 class="text-2xl font-semibold">Ask the Docs</h1>

    <div class="grid gap-3">
      <label class="block">
        <span class="text-sm opacity-80">Question</span>
        <textarea v-model="query" rows="3"
          class="mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
          placeholder="Ask anything about your docs…" />
      </label>

      <div class="flex items-center gap-3">
        <label class="text-sm">Mode</label>
        <select v-model="mode" class="rounded-lg border bg-background px-3 py-2">
          <option value="generate">generate</option>
          <option value="list">list</option>
          <option value="summarize">summarize</option>
        </select>
        <button :disabled="busy" @click="ask"
          class="ml-auto rounded-xl px-4 py-2 shadow-sm border hover:shadow transition disabled:opacity-50">
          <span v-if="!busy">Ask</span>
          <span v-else>Thinking…</span>
        </button>
      </div>
    </div>

    <div v-if="err" class="rounded-md border-l-4 border-red-500 bg-red-500/10 p-4 text-red-300">
      {{ err }}
    </div>

    <div v-if="isAnswer" class="space-y-4">
      <h2 class="text-xl font-semibold">Answer</h2>
      <MdText :text="answerText" />
      <div v-if="result?.citation?.length" class="space-y-1">
        <div class="text-sm opacity-70">Sources</div>
        <ul class="list-disc pl-6 text-sm">
          <li v-for="(c, i) in result.citation" :key="i">
            <a :href="c.url" target="_blank" rel="noopener">{{ c.name || c.url }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div v-else-if="isList" class="space-y-4">
      <h2 class="text-xl font-semibold">Results</h2>
      <div class="grid gap-3">
        <NlwebCard
          v-for="(el, i) in result.itemListElement"
          :key="i"
          :thing="el.item || el" />
      </div>
    </div>

    <details v-if="result" class="mt-4">
      <summary class="cursor-pointer opacity-70">Debug JSON</summary>
      <pre class="mt-2 overflow-auto rounded-lg border p-3 text-xs">{{ result }}</pre>
    </details>
  </div>
</template>



