<template>
  <div class="bg-neutral-900 text-white rounded-lg p-5">
    <div class="mb-2 font-mono text-xs text-gray-400">
      {{ tag }} {{ label }}
    </div>
    <div class="text-sm">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  tag: String,
  label: String,
});
</script>
