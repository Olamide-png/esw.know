<script setup lang="ts">
import { ref } from 'vue'

interface Msg { role: 'user'|'assistant'; text?: string; ui?: any }

const open = ref(false)
const input = ref('')
const messages = ref<Msg[]>([])
const loading = ref(false)

async function send() {
  const q = input.value.trim()
  if (!q) return
  input.value = ''
  messages.value.push({ role: 'user', text: q })
  loading.value = true

  const meta = {
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    sel: typeof window !== 'undefined' ? window.getSelection()?.toString() || undefined : undefined
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, meta })
  })

  if (!res.body) { loading.value = false; return }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const asst: Msg = { role: 'assistant', text: '' }
  messages.value.push(asst)

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        if (json.type === 'text') asst.text += json.delta
        if (json.type === 'ui') asst.ui = json.payload
      } catch {
        asst.text += data
      }
    }
  }
  loading.value = false
}
</script>

<template>
  <div>
    <div class="fixed bottom-5 right-5 z-50">
      <UiSheet v-model:open="open">
        <UiSheetTrigger as-child>
          <UiButton class="rounded-full shadow-lg h-12 w-12 p-0">💬</UiButton>
        </UiSheetTrigger>

        <UiSheetContent side="right" class="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <UiSheetHeader>
            <UiSheetTitle>Ask this site</UiSheetTitle>
          </UiSheetHeader>

          <div class="flex flex-col gap-4 h-[80vh]">
            <div class="flex-1 overflow-y-auto pr-1 space-y-4">
              <div v-for="(m, i) in messages" :key="i" class="grid gap-2">
                <div :class="m.role==='user' ? 'justify-end' : 'justify-start'" class="flex">
                  <div :class="m.role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                       class="rounded-2xl px-3 py-2 max-w-[85%] whitespace-pre-wrap">
                    {{ m.text }}
                  </div>
                </div>
                <div v-if="m.ui" class="rounded-xl border p-3 text-xs opacity-90">
                  <pre class="overflow-x-auto"><code>{{ JSON.stringify(m.ui, null, 2) }}</code></pre>
                  <!-- swap in your renderer when ready -->
                </div>
              </div>
              <div v-if="loading" class="text-xs opacity-70">Thinking…</div>
            </div>

            <form class="flex gap-2" @submit.prevent="send">
              <input v-model="input" class="flex-1 border rounded-xl px-3 py-2 bg-background"
                     placeholder="Ask about this page or docs…" />
              <UiButton type="submit">Send</UiButton>
            </form>
          </div>
        </UiSheetContent>
      </UiSheet>
    </div>
  </div>
</template>
