<script setup lang="ts">
const specUrl = '/openapi.bundle.yaml'
</script>

<template>
  <ClientOnly>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@scalar/console"></script>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <scalar-console spec-url="/openapi.bundle.yaml" theme="auto" />
    </div>
  </ClientOnly>
</template>
