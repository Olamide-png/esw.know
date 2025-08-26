<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{ chatHash: string }>()

onMounted(() => {
  // avoid loading twice when navigating
  if ((window as any).__galiLoaded) return
  ;(window as any).__galiLoaded = true

  const s = document.createElement('script')
  s.src = 'https://widget.galichat.com/gali-embeded.min.js'
  s.defer = true
  // replicate your attributes
  s.setAttribute('chat-hash', props.chatHash)
  document.body.appendChild(s)
})
</script>

<template>
  <!-- The widget mounts itself, so we don't need a container -->
  <div aria-hidden="true" />
</template>

