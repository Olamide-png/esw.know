<template>
  <button
    ref="btn"
    class="fixed bottom-4 right-4 z-[998] inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg hover:bg-muted"
    @click="open(btn!)"
    aria-haspopup="dialog"
    aria-controls="chatbot-drawer"
  >
    💬 <span class="font-medium">Chat</span>
  </button>

  <ChatbotDrawer
    id="chatbot-drawer"
    :model-value="isOpen"
    @update:modelValue="v => isOpen = v"
    @close="onClose"
    @minimize="onMinimize"
    :overlay="true"
    :esc-to-close="true"
    :click-outside-to-close="true"
    title="AI Assistant"
  >
    <!-- Your chatbot UI goes here -->
    <div class="flex h-full flex-col">
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- messages area -->
        <div class="rounded-lg border p-3 text-sm">Hello! How can I help?</div>
      </div>
      <form class="border-t p-2 flex gap-2"
            @submit.prevent="send">
        <input v-model="message"
               class="flex-1 rounded-md border px-3 py-2 outline-none focus:ring"
               placeholder="Type your message…" />
        <button class="rounded-md border px-3 py-2 hover:bg-muted">Send</button>
      </form>
    </div>
  </ChatbotDrawer>
</template>

<script setup lang="ts">
import ChatbotDrawer from '~/components/ChatbotDrawer.vue'
import { useChatbot } from '~/composables/useChatbot'

const { isOpen, open, close } = useChatbot()
const btn = ref<HTMLElement | null>(null)

const message = ref('')

const onClose = () => {
  // additional cleanup if needed
}
const onMinimize = () => {
  close()
  // You could show a smaller “minimized” chip instead of the FAB here.
}

const send = () => {
  if (!message.value.trim()) return
  // TODO: hook into your AI endpoint / event stream here.
  message.value = ''
}
</script>
