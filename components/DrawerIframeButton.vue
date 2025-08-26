<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
</script>

<template>
  <div class="space-y-4">
    <button
      @click="open = true"
      class="px-4 py-2 rounded-md bg-primary text-primary-foreground"
    >
      Open Help
    </button>

    <DrawerIframe
      v-model:open="open"
      src="https://example.com"
      title="Help Center"
      :allowFullScreen="true"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  </div>
</template>
