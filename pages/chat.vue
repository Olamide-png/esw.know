<template>
  <div class="min-h-screen flex bg-background">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed md:static inset-y-0 left-0 z-40 w-72 border-r bg-muted/40 backdrop-blur transition-transform',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between px-3 py-3 border-b">
          <div class="font-semibold">History</div>
          <button class="rounded-md border px-2 py-1 text-xs" @click="newThread">
            <Icon name="lucide:plus" class="w-4 h-4 inline-block mr-1" /> New
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            v-for="t in threads"
            :key="t.id"
            @click="selectThread(t.id)"
            :class="[
              'group w-full text-left px-3 py-2 rounded-md flex items-center gap-2',
              currentId === t.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
            ]"
          >
            <Icon name="lucide:message-square" class="w-4 h-4 opacity-70" />
            <span class="truncate flex-1">{{ t.title || 'New chat' }}</span>
            <button
              class="opacity-0 group-hover:opacity-100 transition"
              @click.stop="deleteThread(t.id)"
              title="Delete"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </button>
        </nav>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 min-w-0 flex flex-col">
      <!-- Top bar -->
      <header class="flex items-center gap-2 border-b px-3 py-3">
        <button class="md:hidden rounded-md border p-2" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle sidebar">
          <Icon name="lucide:panel-left-open" class="w-5 h-5" />
        </button>
        <Icon name="lucide:bot" class="w-5 h-5" />
        <h1 class="font-medium">AI Assistant</h1>
        <div class="ml-auto flex items-center gap-2">
          <button class="hidden md:inline-flex rounded-md border px-2 py-1 text-xs" @click="newThread">
            <Icon name="lucide:plus" class="w-4 h-4 mr-1" /> New chat
          </button>
        </div>
      </header>

      <!-- Messages -->
      <section ref="scrollEl" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        <MessageBubble
          v-for="(m, i) in (current?.messages || [])"
          :key="i"
          :role="m.role"
          :content="m.content"
        />
        <div v-if="loading" class="flex items-start gap-2 text-sm opacity-80">
          <Icon name="lucide:bot" class="h-5 w-5 mt-0.5" />
          <span class="animate-pulse">Thinking…</span>
        </div>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </section>

      <!-- Input -->
      <footer class="shrink-0 border-t p-3 bg-background/60">
        <form @submit.prevent="onSend">
          <div class="flex items-start gap-2">
            <textarea
              v-model="draft"
              rows="3"
              placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
              class="w-full resize-none rounded-lg border bg-background px-3 py-2 text-base leading-6 shadow-sm focus:outline-none focus:ring focus:ring-primary/40 min-h-[3.25rem] max-h-[45vh]"
              @keydown.enter.exact.prevent="onSend"
              ref="taRef"
            ></textarea>
            <button
              type="submit"
              class="mt-1.5 inline-flex items-center gap-2 rounded-lg border bg-primary text-primary-foreground px-3 py-2 text-sm shadow hover:shadow-md disabled:opacity-50"
              :disabled="loading || !draft.trim()"
            >
              <Icon name="lucide:send" class="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })


import { ref, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '~/www/composables/useChatStore'
import MessageBubble from '~/www/components/MessageBubble.vue'

const { threads, current, currentId, loading, error, newThread, selectThread, deleteThread, send } = useChatStore()

const draft = ref('')
const sidebarOpen = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)

function scrollToBottom(smooth = false) {
  requestAnimationFrame(() => {
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  })
}
async function onSend() {
  const text = draft.value.trim()
  if (!text || loading.value) return
  draft.value = ''
  await send(text)
  scrollToBottom(true)
}

watch(current, () => nextTick(() => scrollToBottom()))
onMounted(() => scrollToBottom())
</script>

