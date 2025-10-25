<template>
  <div class="fixed inset-0 z-50 bg-white dark:bg-neutral-900">
    <iframe
      ref="iframe"
      :src="src"
      class="w-screen h-screen border-none"
      allowfullscreen
      allow="fullscreen"
      frameborder="0"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
})

const iframe = ref(null)

onMounted(() => {
  if (iframe.value?.requestFullscreen) {
    iframe.value.requestFullscreen().catch((err) => {
      console.warn('Fullscreen not allowed:', err)
    })
  }
})
</script>
