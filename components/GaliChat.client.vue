<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{ chatHash: string }>()

onMounted(() => {
  // prevent double-injection on route changes
  if ((window as any).__galiLoaded) return
  ;(window as any).__galiLoaded = true

  const s = document.createElement('script')
  s.src = 'https://widget.galichat.com/gali-embeded.min.js'
  s.defer = true
  s.setAttribute('chat-hash', props.chatHash)
  document.body.appendChild(s)
})
</script>

<template>
  <!-- Gali mounts itself; no markup needed -->
  <div aria-hidden="true" />
</template>
