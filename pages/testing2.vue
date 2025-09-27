<!-- www/pages/testing2.vue -->
<script setup lang="ts">
const show = ref(false)   // Nuxt auto-imports ref
</script>

<template>
  <main class="p-6 space-y-4">
    <h1 class="text-2xl font-semibold">Testing 2 — Ask the Docs</h1>

    <button
      class="rounded-xl bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900"
      @click="show = true"
    >
      Open RAG Modal
    </button>

    <RagDialog
      v-model="show"
      :k="8"
      prefill="What are the ESW rounding rules?"
      :samples="[
        'How do I enable localized front-end prices?',
        'Where do I configure shipping methods?',
        'Show an example of pricing models in v4.0'
      ]"
    />
  </main>
</template>

