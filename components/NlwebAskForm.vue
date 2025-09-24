<!-- components/NlwebAskForm.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  submit: [payload: { query: string }]
}>()

const q = ref('')
function onSubmit() {
  emit('submit', { query: q.value.trim() })
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex gap-2 items-center">
    <input
      v-model="q"
      type="text"
      placeholder="Ask your docs… e.g. “How do I create a return label?”"
      class="flex-1 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
    <button
      type="submit"
      class="inline-flex items-center gap-2 rounded-2xl px-4 py-3 border border-transparent bg-primary text-primary-foreground shadow hover:opacity-90"
    >
      <Icon name="lucide:send" class="w-4 h-4" aria-hidden="true" />
      <span>Ask</span>
    </button>
  </form>
</template>
