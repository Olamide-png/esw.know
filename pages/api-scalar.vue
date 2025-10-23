<script setup lang="ts">
import { onMounted, ref } from 'vue'

const ready = ref(false)

onMounted(() => {
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
  s.async = true
  s.onload = () => (ready.value = true)
  s.onerror = () => console.error('Failed to load Scalar CDN')
  document.head.appendChild(s)
})
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <api-reference
        v-if="ready"
        spec-url="/openapi.bundle.yaml"
        layout="modern"
        theme="auto"
        hide-client-button
      />
    </div>
  </ClientOnly>
</template>

