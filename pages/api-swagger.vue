<script setup lang="ts">
import { onMounted } from 'vue'
import SwaggerUI from 'swagger-ui-dist'
import 'swagger-ui-dist/swagger-ui.css'

onMounted(() => {
  SwaggerUI({
    dom_id: '#swagger',
    url: '/openapi.bundle.yaml', // from public/
    docExpansion: 'list',
    deepLinking: true
  })
})
</script>

<template>
  <ClientOnly>
    <div id="swagger" class="min-h-screen dark:bg-neutral-950 dark:text-white"></div>
  </ClientOnly>
</template>

<style>
/* simple dark tweak */
.dark .swagger-ui { color: #e5e7eb; }
.dark .swagger-ui .topbar { background: transparent; }
</style>
