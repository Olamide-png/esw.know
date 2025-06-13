<template>
  <div>
    <p class="font-mono text-sm text-blue-600 mb-1">
      {{ name }} <span class="text-gray-500">({{ type }})</span>
    </p>
    <div class="text-sm text-gray-800 dark:text-gray-200">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  type: String,
});
</script>
