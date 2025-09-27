<script setup lang="ts">
import { ref, watch, computed } from 'vue'

type Source = { id: number|string; title: string; url?: string|null; score?: number }
type ChatResp = { answer: string; sources: Source[] }

const props = defineProps<{
  modelValue: boolean
  prefill?: string
  k?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const open = ref(props.modelValue)
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))

const question = ref(props.prefill ?? '')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const answer = ref<string | null>(null)
const sources = ref<Source[]>([])

const canAsk = computed(() => question.value.trim().length > 2)

async function ask() {
  if (!canAsk.value) return
  loading.value = true
  errorMsg.value = null
  answer.value = null
  sources.value = []
  try {
    const res = await $fetch<ChatResp>('/api/rag/chat', {
      method: 'POST',
      body: { question: question.value, k: props.k ?? 6 }
    })
    answer.value = res.answer
    sources.value = res.sources || []
  } catch (e: any) {

    errorMsg.value =
      e?.data?.error ||
      e?.statusMessage ||
      e?.message ||
      'Request failed'
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask()
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
        @click.self="open = false"
      >
        <div class="mx-auto mt-20 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Ask the docs</h2>
            <button class="rounded-lg p-2 hover:bg-gray-100" @click="open = false" aria-label="Close">✕</button>
          </div>

          <div class="mt-4">
            <textarea
              v-model="question"
              @keydown="onKey"
              rows="4"
              class="w-full rounded-xl border border-gray-300 p-3 focus:border-gray-400 focus:outline-none"
              placeholder="Ask anything about these docs… (⌘/Ctrl + Enter to submit)"
            />
            <div class="mt-2 flex items-center gap-2">
              <button
                :disabled="!canAsk || loading"
                @click="ask"
                class="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                <span v-if="!loading">Ask</span>
                <span v-else>Thinking…</span>
              </button>
              <span class="text-xs text-gray-500">Uses /api/rag/chat</span>
            </div>
          </div>

          <div class="mt-4">
            <p v-if="errorMsg" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ errorMsg }}</p>

            <div v-if="answer" class="prose max-w-none">
              <!-- naive markdown-ish display; swap in your real MD renderer if you have one -->
              <p style="white-space:pre-wrap">{{ answer }}</p>
            </div>

            <div v-if="sources.length" class="mt-4 border-t pt-3">
              <h3 class="mb-2 text-sm font-medium text-gray-700">Sources</h3>
              <ul class="space-y-1 text-sm">
                <li v-for="(s, i) in sources" :key="s.id">
                  <span class="font-mono text-gray-500">[#{{ i + 1 }}]</span>
                  <a v-if="s.url" :href="s.url" target="_blank" class="ml-1 underline hover:no-underline">
                    {{ s.title }}
                  </a>
                  <span v-else class="ml-1">{{ s.title }}</span>
                  <span v-if="s.score !== undefined" class="ml-1 text-gray-400">({{ (s.score*100).toFixed(0) }})</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>

