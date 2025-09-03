<template>
  <div :class="wrapper">
    <div :class="[bubble, (!isExpanded && isLong) ? 'max-h-[40vh] overflow-auto' : '']">
      <slot>{{ content }}</slot>
    </div>
    <button
      v-if="isLong"
      class="mt-1 text-[11px] opacity-70 hover:opacity-100 underline"
      @click="isExpanded = !isExpanded"
    >
      {{ isExpanded ? 'Collapse' : 'Show more' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{ role: 'system'|'user'|'assistant'; content: string }>()
const isExpanded = ref(false)
const isLong = computed(() => (props.content?.length || 0) > 600)

const wrapper = computed(() =>
  props.role === 'user' ? 'flex justify-end' : 'flex justify-start'
)

const bubble = computed(() =>
  props.role === 'user'
    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm shadow break-words whitespace-pre-wrap'
    : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm shadow break-words whitespace-pre-wrap'
)
</script>
