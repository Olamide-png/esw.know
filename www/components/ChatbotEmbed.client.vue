<template>
  <!-- Optional holder. You can remove this div if you don’t need UI here -->
  <div aria-hidden="true" />
</template>

<script setup lang="ts">
const props = defineProps<{
  hash: string
}>()

/**
 * Inject the 3rd-party script into the document head on the client.
 */
useHead({
  script: [
    {
      src: 'https://widget.galichat.com/gali-embeded.min.js',
      defer: true,
      // Nuxt lets you pass custom attributes via `attrs`
      attrs: { 'chat-hash': props.hash }
    }
  ]
})
</script>
