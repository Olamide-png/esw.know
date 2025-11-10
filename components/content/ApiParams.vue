<template>
  <section class="relative w-full">
    <div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur">
      <header v-if="title" class="px-4 py-3 sm:px-6 border-b border-black/10 dark:border-white/10">
        <h3 class="text-base sm:text-lg font-semibold tracking-tight text-foreground">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-foreground/60">{{ subtitle }}</p>
      </header>

      <div class="divide-y divide-black/10 dark:divide-white/10">
        <ApiParam
          v-for="(n, i) in nodes"
          :key="i"
          :node="n"
          :level="0"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ApiParam from './ApiParam.vue'

const props = defineProps({
  /**
   * Pass your schema as JSON string (recommended) or a compact pipe-string.
   * JSON example is shown below in the usage section.
   */
  schema: { type: String, required: true },
  title: { type: String, default: 'Parameters' },
  subtitle: { type: String, default: '' },
})

/** Robustly parse JSON; if fails, try pipe-list "name:type:required|..." (simple cases) */
function parseSchema(raw) {
  const s = (raw || '').trim()
  if (!s) return []
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v : []
  } catch {
    // Fallback pipe list: "tenantCode:string:required|provider:string|items:array:required"
    return s.split('|').map((row) => {
      const [name, type = 'string', req = ''] = row.split(':').map(x => x?.trim())
      return { name, type, required: ['true','required','yes'].includes((req||'').toLowerCase()) }
    })
  }
}

const nodes = computed(() => parseSchema(props.schema))
</script>
