<template>
  <div :class="wrapper">
    <div :class="bubble">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ role: 'system'|'user'|'assistant'; content: string }>()

const wrapper = computed(() => props.role === 'user'
  ? 'flex justify-end'
  : 'flex justify-start')

const bubble = computed(() => props.role === 'user'
  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm shadow'
  : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm shadow')
</script>