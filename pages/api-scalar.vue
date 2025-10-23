<script setup lang="ts">
const specUrl = '/openapi.bundle.yaml' // or '/api/openapi.json' if you serve it via Nitro
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <api-reference
        spec-url="/openapi.bundle.yaml"
        layout="modern"
        theme="auto"
        hide-client-button
      />
    </div>
  </ClientOnly>
</template>
