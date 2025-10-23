<script setup lang="ts">
const specUrl = '/openapi.bundle.yaml'
</script>

<template>
  <ClientOnly>
    <script type="module" src="https://unpkg.com/rapi-ui/dist/rapi-ui.min.js"></script>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <rapi-ui
        spec-url="/openapi.bundle.yaml"
        nav-style="drilldown"     
        layout="classic"          
        theme="auto"
      ></rapi-ui>
    </div>
  </ClientOnly>
</template>
