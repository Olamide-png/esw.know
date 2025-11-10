<template>
  <section class="relative w-full">
    <div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur">
      <header v-if="title" class="px-4 py-3 sm:px-6 border-b border-black/10 dark:border-white/10">
        <h3 class="text-base sm:text-lg font-semibold tracking-tight text-foreground">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-foreground/60">{{ subtitle }}</p>
      </header>

      <div class="divide-y divide-black/10 dark:divide-white/10">
        <div v-for="(n, i) in nodes" :key="i" class="px-4 sm:px-6 py-3">
          <ApiParamRow :node="n" :level="0" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ApiParamRow from './ApiParamRow.vue'

const props = defineProps({
  /** JSON array schema: see usage example */
  schema:   { type: String, required: true },
  title:    { type: String, default: 'Parameters' },
  subtitle: { type: String, default: '' },
})

const nodes = computed(() => {
  try {
    const v = JSON.parse(props.schema)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
})
</script>


