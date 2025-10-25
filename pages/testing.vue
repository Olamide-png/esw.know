<script setup lang="ts">
import RagModal from '~/www/components/RagModal.vue'
const show = ref(false)
const prefill = 'Ask the docs'
</script>

<template>
  <div class="p-6">
    <h1 class="mb-4 text-2xl font-semibold">Welcome</h1>

    <button
      class="rounded-xl bg-black px-4 py-2 text-white"
      @click="show = true"
    >
      Ask the docs
    </button>

    <RagModal v-model="show" :prefill="prefill" :k="6" />
  </div>
</template>
