<script setup lang="ts">
const specUrl = '/openapi.bundle.yaml' // served from /public
</script>

<template>
  <ClientOnly>
    <link rel="preconnect" href="https://cdn.redoc.ly" />
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <div class="min-h-screen">
      <redoc :spec-url="specUrl" suppress-warnings hide-download-button />
    </div>
  </ClientOnly>
</template>

