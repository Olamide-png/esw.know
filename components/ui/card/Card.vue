<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-gradient-to-r from-primary to-blue-500 text-card-foreground shadow-md',
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
