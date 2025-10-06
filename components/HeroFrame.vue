<!-- components/HeroFrame.vue -->
<template>
  <section class="relative isolate overflow-hidden" :class="outerClass">
    <!-- Background -->
    <div class="absolute inset-0 -z-10">
      <ClientOnly>
        <FlickeringGrid
          class="absolute inset-0"
          :square-size="4"
          :grid-gap="8"
          :flicker-chance="0.35"
          color="var(--hero-accent, #22d3ee)"
          :max-opacity="0.28"
        />
      </ClientOnly>
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />
    </div>

    <!-- Foreground (your ::hero content goes here) -->
    <div class="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ outerClass?: string }>()
</script>

<style scoped>
:root { --hero-accent: #22d3ee; }
.dark :root { --hero-accent: #60a5fa; }
</style>
