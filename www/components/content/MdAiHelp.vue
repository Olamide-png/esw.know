<template>
  <div class="mt-2">
    <button
      class="text-sm underline text-primary disabled:opacity-60"
      :disabled="loading"
      @click="ask"
    >
      {{ loading ? 'Getting help…' : (label || 'Need help?') }}
    </button>
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>

    <!-- Render AI answer as markdown -->
    <div v-if="answer" class="mt-2 text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
      <ContentRendererMarkdown :value="answer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ContentRendererMarkdown } from '#components'

const props = defineProps<{ query: string; label?: string; extraContext?: string }>()
const answer = ref('')
const error = ref('')
const loading = ref(false)

async function ask() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/ai-help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: props.query,
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        pageUrl: typeof location !== 'undefined' ? location.href : '',
        extraContext: props.extraContext || ''
      })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    answer.value = data.answer || ''
  } catch (e: any) {
    error.value = e?.message || 'Failed to fetch help.'
  } finally {
    loading.value = false
  }
}
</script>

