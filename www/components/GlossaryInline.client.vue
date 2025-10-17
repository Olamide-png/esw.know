<script setup lang="ts">
const props = defineProps<{ term?: string; text?: string }>()
</script>

<template>
  <span class="inline align-baseline">
    <slot>{{ props.text || props.term || '' }}</slot>
  </span>
</template>
