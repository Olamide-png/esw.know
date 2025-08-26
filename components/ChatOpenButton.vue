<template>
  <button
    class="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 hover:bg-muted"
    @click="onClick"
  >
    💬 <slot>Ask AI</slot>
  </button>
</template>

<script setup lang="ts">
import { useChatbot } from '~/composables/useChatbot'
const { open } = useChatbot()
function onClick(e: MouseEvent) {
  open(e.currentTarget as HTMLElement)
}
</script>
