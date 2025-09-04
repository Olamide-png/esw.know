<template>
  <div class="relative w-full max-w-3xl">
    <form @submit.prevent="emit('ask', modelValue)">
      <div class="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 shadow-sm">
        <Icon name="lucide:bot" class="w-5 h-5 opacity-80" />
        <input
          v-model="inner"
          :placeholder="placeholder"
          class="w-full bg-transparent outline-none text-base"
          aria-label="Ask AI"
        />
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-md border bg-primary text-primary-foreground px-3 py-1.5 text-sm shadow hover:shadow-md disabled:opacity-50"
          :disabled="!inner.trim()"
        >
          <Icon name="lucide:send" class="w-4 h-4" />
          <span class="hidden sm:inline">Ask</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AiSearchBar' }) // ✅ gives MDC tag `ai-search-bar`

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{ ask: [string]; 'update:modelValue': [string] }>()
const inner = computed({
  get: () => props.modelValue ?? '',
  set: v => emit('update:modelValue', v)
})

const placeholder = computed(() => props.placeholder || 'Ask our docs…')
</script>


