<template>
  <div
    :class="
      cn(
        // Light mode: soft blue → white
        'rounded-lg border border-transparent bg-gradient-to-b from-[#e6f1fb] via-[#f4f8fd] to-white shadow-md',
        // Dark mode: deep blue-black fade
        'dark:bg-gradient-to-b dark:from-[#0b1220] dark:via-[#0a0f1a] dark:to-[#05080f]',
        // Helpful defaults
        'text-slate-900 dark:text-slate-100 ring-1 ring-black/5 dark:ring-white/5',
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

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>




