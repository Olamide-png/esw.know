<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card text-card-foreground shadow-md ring-1 ring-primary/20 shadow-primary/10 hover:shadow-primary/30 transition-shadow',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>





