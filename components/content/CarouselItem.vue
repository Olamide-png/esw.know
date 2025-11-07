<template>
  <!-- Each slide takes full width in the flex track -->
  <figure class="basis-full shrink-0">
    <div class="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
      <img
        :src="src"
        :alt="alt"
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <figcaption v-if="caption" class="absolute inset-x-0 bottom-0 p-4">
        <span class="inline-flex items-center rounded-lg bg-black/40 text-white backdrop-blur px-3 py-1 text-xs sm:text-sm">
          {{ caption }}
        </span>
      </figcaption>
    </div>
  </figure>
</template>

<script setup>
defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
})
</script>
