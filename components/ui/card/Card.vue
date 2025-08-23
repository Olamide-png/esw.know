<template>
  <div
    :class="
      cn(
        'rounded-lg border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-lg backdrop-blur-md text-white',
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



