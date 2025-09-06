<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <GuideProgress :total="steps.length" :done="doneCount" />
    </div>

    <UiCard>
      <UiCardContent class="p-0">
        <ul class="divide-y">
          <li v-for="(step, i) in steps" :key="step._id" class="p-4">
            <div class="flex items-start gap-3">
              <UiCheckbox :checked="isDone(step._id)" @update:checked="toggle(step._id)" class="mt-1" />
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium leading-tight">{{ i + 1 }}. {{ step.title }}</p>
                    <p v-if="step.description" class="text-sm text-muted-foreground mt-1">{{ step.description }}</p>
                  </div>
                  <div class="shrink-0 flex items-center gap-2">
                    <UiButton size="sm" variant="outline" @click="onHelp(step)">Need help?</UiButton>
                    <UiBadge v-if="step.blocking" variant="secondary">Blocking</UiBadge>
                  </div>
                </div>
                <div v-if="hints[step._id] && hints[step._id].length" class="mt-3 grid gap-2">
                  <div v-for="(hint, idx) in hints[step._id]" :key="idx" class="text-sm rounded-md border p-3 bg-muted/30">
                    <p class="font-medium mb-1">Hint</p>
                    <p class="leading-relaxed">{{ hint }}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </UiCardContent>
    </UiCard>

    <div class="flex items-center gap-2">
      <UiButton size="sm" variant="secondary" @click="markAll(true)" :disabled="doneCount === steps.length">Mark all done</UiButton>
      <UiButton size="sm" variant="ghost" @click="reset" :disabled="doneCount === 0">Reset</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import GuideProgress from './GuideProgress.vue'

// shadcn/ui components (nuxt module provides these aliases)
import { Button as UiButton } from '@/components/ui/button'
import { Card as UiCard, CardContent as UiCardContent } from '@/components/ui/card'
import { Checkbox as UiCheckbox } from '@/components/ui/checkbox'
import { Badge as UiBadge } from '@/components/ui/badge'

import { useGuideState } from './useGuideState'
import { useAiHelp } from './useAiHelp'

interface StepInput {
  id?: string
  title: string
  description?: string
  helpPrompt?: string
  blocking?: boolean
}

const props = defineProps<{
  id: string
  title: string
  description?: string
  steps: StepInput[]
}>()

const route = useRoute()
const storageKey = computed(() => `esw.guide:${route.path}:${props.id}`)
const { state, toggle, setAll, reset } = useGuideState(storageKey.value)
const { requestHelp } = useAiHelp()

const steps = computed(() => props.steps.map((s, idx) => ({
  _id: s.id || `${props.id}-${idx + 1}`,
  ...s,
})))

const doneCount = computed(() => steps.value.filter(s => state.done[s._id]).length)

function isDone(id: string) {
  return !!state.done[id]
}
function markAll(val: boolean) { setAll(steps.value.map(s => s._id), val) }

// Hints store (ephemeral per session). Could be hydrated by AI responses.
const hints = reactive<Record<string, string[]>>({})

async function onHelp(step: any) {
  const pageTitle = (document?.title || 'this page').replace(/\s+\|.*/, '')
  const context = {
    pageTitle,
    guideId: props.id,
    stepId: step._id,
    stepTitle: step.title,
    stepDescription: step.description,
  }
  const prompt = step.helpPrompt || `Explain how to complete this step: "${step.title}". If relevant, use details from ${pageTitle}. Provide concise, actionable guidance with links or code snippets.`
  const hint = await requestHelp({ prompt, context })
  if (!hints[step._id]) hints[step._id] = []
  hints[step._id].push(hint)
}

onMounted(() => {
  // Ensure we have keys for steps added later
  steps.value.forEach(s => { if (state.done[s._id] === undefined) state.done[s._id] = false })
})

watch(steps, (next) => {
  // Persist stable keys as steps change
  next.forEach(s => { if (state.done[s._id] === undefined) state.done[s._id] = false })
})
</script>









