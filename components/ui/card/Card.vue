<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card text-card-foreground shadow-lg',
        // Glow effect only when dark mode is active
        'dark:ring-1 dark:ring-primary/20 dark:shadow-primary/20 dark:hover:shadow-primary/40 dark:transition-shadow',
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






