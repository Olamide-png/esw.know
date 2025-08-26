<script setup lang="ts">
import { onMounted } from 'vue'
import { useHead } from '#imports'

const props = defineProps<{ chatHash: string }>()

onMounted(() => {
  // Prevent duplicate loads on route changes
  if ((window as any).__galiLoaded) return
  ;(window as any).__galiLoaded = true
})

useHead({
  script: [
    {
      key: 'gali-widget',
      src: 'https://widget.galichat.com/gali-embeded.min.js',
      defer: true,
      // place at end of body so it reliably runs after hydration
      tagPosition: 'bodyClose',
      // pass through the custom attribute exactly as the vendor expects
      'chat-hash': props.chatHash
    }
  ]
})
</script>

<template>
  <!-- Widget mounts itself; no container required -->
  <div aria-hidden="true" />
</template>


