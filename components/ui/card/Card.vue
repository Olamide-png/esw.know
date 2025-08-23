<template>
  <div
    :class="
      cn(
        'rounded-lg border border-white/20 bg-gradient-to-r from-primary/80 via-blue-500/70 to-purple-500/80 text-white shadow-lg backdrop-blur-sm',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

