<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">Step-by-Step Walkthrough</h2>
      <div class="text-sm text-muted-foreground">
        {{ completedCount }} / {{ steps.length }} completed
      </div>
    </div>

    <div
      v-for="(step, idx) in steps"
      :key="idx"
      class="flex items-start gap-3 p-4 rounded-lg border bg-background"
    >
      <input
        type="checkbox"
        v-model="step.completed"
        @change="persist()"
        class="mt-1 h-5 w-5 rounded border-gray-300 focus:ring-primary"
      />

      <div class="flex-1">
        <p class="font-medium">{{ step.text }}</p>

        <div class="mt-2 flex items-center gap-3">
          <button
            class="text-sm underline text-primary disabled:opacity-60"
            :disabled="step.loading"
            @click="getHelp(step)"
          >
            {{ step.loading ? 'Getting help…' : 'Need help?' }}
          </button>

          <button
            v-if="step.help"
            class="text-xs text-muted-foreground underline"
            @click="step.help = ''"
          >
            Clear help
          </button>
        </div>

        <p v-if="step.error" class="mt-2 text-sm text-red-600">
          {{ step.error }}
        </p>
        <p v-if="step.help" class="mt-2 text-sm text-muted-foreground whitespace-pre-line">
          {{ step.help }}
        </p>
      </div>
    </div>

    <div class="flex gap-3">
      <button
        class="px-3 py-2 rounded-md border hover:bg-accent"
        @click="resetProgress"
      >
        Reset progress
      </button>
      <button
        class="px-3 py-2 rounded-md border hover:bg-accent"
        @click="markAllDone"
      >
        Mark all done
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Step = {
  text: string
  completed: boolean
  help?: string
  loading?: boolean
  error?: string
}

const props = withDefaults(defineProps<{
  initialSteps?: string[]
  storageKey?: string
  extraContext?: string
}>(), {
  initialSteps: () => [
    'Install the app from the provided link',
    'Log into your admin dashboard',
    'Configure your settings',
  ],
  storageKey: () => `walkthrough:${typeof window !== 'undefined' ? location.pathname : ''}`,
  extraContext: '',
})

const steps = ref<Step[]>(props.initialSteps.map(t => ({ text: t, completed: false })))

const completedCount = computed(() => steps.value.filter(s => s.completed).length)

function persist() {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(steps.value))
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(props.storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) steps.value = parsed
    }
  } catch {}
}

function resetProgress() {
  steps.value.forEach(s => { s.completed = false; s.help = ''; s.error = '' })
  persist()
}

function markAllDone() {
  steps.value.forEach(s => { s.completed = true })
  persist()
}

async function getHelp(step: Step) {
  step.loading = true
  step.error = ''
  try {
    const res = await fetch('/api/ai-help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `Help with: ${step.text}`,
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        pageUrl: typeof location !== 'undefined' ? location.href : '',
        extraContext: props.extraContext || ''
      })
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(txt || `Request failed: ${res.status}`)
    }
    const data = await res.json()
    step.help = data.answer || 'No answer generated.'
    persist()
  } catch (e: any) {
    step.error = e?.message || 'Failed to fetch help.'
  } finally {
    step.loading = false
  }
}

onMounted(load)
</script>

