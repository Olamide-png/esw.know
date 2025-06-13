<template>
  <div :class="sticky ? 'md:sticky top-24' : ''">
    <slot />
  </div>
</template>

<script setup>
defineProps({ sticky: Boolean });
</script>
