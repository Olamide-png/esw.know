<script setup lang="ts">
import { ref } from 'vue'
import type { AskDocsRequest, AskDocsResponse } from '~/types/ask-docs'

const open = defineModel<boolean>({ default: false })
const busy = ref(false)
const question = ref('')
const path = ref<string | undefined>(undefined)
const err = ref('')
const answer = ref<string>('')               // markdown
const cites = ref<AskDocsResponse['citations']>([])

async function ask() {
  err.value = ''
  answer.value = ''
  cites.value = []
  const payload: AskDocsRequest = { question: question.value, path: path.value, maxChars: 12000, k: 6 }
  busy.value = true
  try {
    const res = await $fetch<AskDocsResponse>('/api/nl/ask', { method: 'POST', body: payload })
    answer.value = res.answer
    cites.value = res.citations
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Failed to ask docs'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-start justify-center p-4 md:p-8">
      <!-- backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="open=false" />
      <!-- panel -->
      <div class="relative w-full max-w-3xl rounded-2xl bg-neutral-900 text-neutral-100 shadow-2xl ring-1 ring-white/10">
        <div class="flex items-center justify-between px-5 py-4">
          <div class="text-lg font-semibold">Ask Docs</div>
          <button class="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:text-white" @click="open=false">esc to close</button>
        </div>

        <div class="px-5 pb-4 space-y-3">
          <div class="flex gap-2">
            <input v-model="question" @keyup.enter="ask"
              class="flex-1 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 outline-none focus:border-neutral-500"
              placeholder="Ask anything about your docs…" />
            <button @click="ask" :disabled="busy || !question"
              class="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-white text-black font-medium disabled:opacity-50">
              <Icon name="lucide:send" class="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <label class="text-neutral-400">Scope (optional):</label>
            <input v-model="path" class="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none" placeholder="/shopify/installation" />
          </div>

          <p v-if="err" class="text-rose-400 text-sm">{{ err }}</p>

          <div v-if="busy" class="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-neutral-300">
            Thinking…
          </div>

          <div v-else-if="answer" class="rounded-xl border border-neutral-800 bg-neutral-900 p-4 prose prose-invert max-w-none">
            <ContentRenderer :value="{ body: { type: 'root', children: [{ type:'html', value: answer }] } }" />
          </div>

          <div v-if="cites.length" class="px-1 pb-5">
            <div class="text-xs uppercase tracking-wide text-neutral-400 mb-2">Sources</div>
            <ul class="grid md:grid-cols-2 gap-2">
              <li v-for="(c,i) in cites" :key="c.chunkId" class="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <div class="text-sm font-medium">[^{{ i+1 }}] {{ c.title }}</div>
                <div class="text-xs text-neutral-400 truncate">{{ c.path }}</div>
                <div class="mt-1 text-xs text-neutral-300 line-clamp-3">{{ c.preview }}</div>
                <NuxtLink v-if="c.url" :to="c.url" class="mt-1 inline-block text-xs text-blue-400 hover:underline">Open</NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,.fade-leave-active{ transition: opacity .18s ease }
.fade-enter-from,.fade-leave-to{ opacity:0 }
</style>
