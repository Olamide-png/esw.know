<template>
  <!-- Renders the same on server and client; script loads only after mount -->
  <span aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{ hash: string }>()

onMounted(() => {
  // Prevent double-injection on client-side navigations
  const existing = document.querySelector('script[data-gali-chat="true"]') as HTMLScriptElement | null
  if (existing) {
    // If you ever change the hash where it's already loaded, keep it in sync
    if (existing.getAttribute('chat-hash') !== props.hash) {
      existing.setAttribute('chat-hash', props.hash)
    }
    return
  }

  const s = document.createElement('script')
  s.src = 'https://widget.galichat.com/gali-embeded.min.js'
  s.defer = true
  s.setAttribute('chat-hash', props.hash)
  s.setAttribute('data-gali-chat', 'true')
  document.head.appendChild(s)
})
</script>
