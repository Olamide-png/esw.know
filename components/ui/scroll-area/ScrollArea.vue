<template>
  <ScrollAreaScrollbar
    :orientation="props.orientation"
    v-bind="delegatedProps"
    :class="cn(base, props.class)"
  >
    <ScrollAreaThumb class="relative flex-1 rounded-full" />
  </ScrollAreaScrollbar>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ScrollAreaScrollbarProps } from './reka-props-shim' // ⬅️ local shim (no external resolution)

import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui' // ✅ runtime stays

type Props = ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }

const props = withDefaults(defineProps<Props>(), { orientation: 'vertical' })

const base =
  'flex touch-none select-none transition-colors ' +
  'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 ' +
  'data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:w-full'

const delegatedProps = computed(() => {
  const { class: _class, orientation: _o, ...rest } = props
  return rest
})
</script>

