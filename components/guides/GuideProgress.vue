<template>
  <div class="flex items-center gap-3">
    <div class="h-2 w-40 bg-muted rounded-full overflow-hidden">
      <div class="h-full bg-primary transition-all" :style="{ width: pct + '%' }" />
    </div>
    <span class="text-sm text-muted-foreground">{{ done }} / {{ total }} ({{ Math.round(pct) }}%)</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ total: number; done: number }>()
const pct = computed(() => props.total === 0 ? 0 : (props.done / props.total) * 100)
</script>