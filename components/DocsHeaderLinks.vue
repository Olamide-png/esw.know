<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(defineProps<{
  askAiUrlBase?: string  // keep for OpenAI; default below
}>(), {
  askAiUrlBase: 'https://chat.openai.com/?q='
})

const route = useRoute()

// Uses your layer's auto-imported composable (no explicit import)
const { page } = useContent()

const prompt = computed(() => {
  const title = page.value?.title || page.value?.head?.title || document?.title || 'this page'
  // Crisp but useful default prompt
  return `Please review and summarize "${title}" from ${location.origin}${route.fullPath}. 
List key points, missing sections, and suggest improvements.`
})

// Build OpenAI URL with encoded prompt
const openAiUrl = computed(() => `${props.askAiUrlBase}${encodeURIComponent(prompt.value)}`)

// For Anthropic (Claude): open claude.ai/new and copy prompt to clipboard first
const openClaude = async () => {
  try {
    await navigator.clipboard.writeText(prompt.value)
  } catch (_) {
    // If clipboard unavailable, we still open Claude
  }
  window.open('https://claude.ai/new', '_blank', 'noopener')
}
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton variant="ghost" size="sm" class="gap-2">
        <SmartIcon name="lucide:sparkles" :size="16" />
        <span class="hidden sm:inline">Ask AI</span>
      </UiButton>
    </UiDropdownMenuTrigger>

    <UiDropdownMenuContent align="end" class="min-w-48">
      <UiDropdownMenuLabel class="text-xs">Send this page</UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />

      <!-- OpenAI -->
      <UiDropdownMenuItem as-child>
        <a :href="openAiUrl" target="_blank" rel="noopener" class="flex items-center gap-2">
          <SmartIcon name="simple-icons:openai" :size="16" />
          <span>OpenAI (ChatGPT)</span>
        </a>
      </UiDropdownMenuItem>

      <!-- Anthropic (Claude) -->
      <UiDropdownMenuItem @select.prevent="openClaude">
        <div class="flex items-center gap-2">
          <SmartIcon name="simple-icons:anthropic" :size="16" />
          <span>Anthropic (Claude)</span>
        </div>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>




