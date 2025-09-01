<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Uses your layer's auto-imported useContent()
const { page } = useContent()
const route = useRoute()

const prompt = computed(() => {
  const title = page.value?.title || page.value?.head?.title || 'this page'
  const url = typeof window !== 'undefined' ? `${location.origin}${route.fullPath}` : route.fullPath
  return `Please read and query "${title}" from ${url}.
So I can ask questions about it.`
})

const openaiUrl = computed(
  () => `https://chat.openai.com/?q=${encodeURIComponent(prompt.value)}`
)

// ✅ Prefill first message in Claude via ?q=
const claudeUrl = computed(
  () => `https://claude.ai/new?q=${encodeURIComponent(prompt.value)}`
)

// ✅ Prefill Perplexity via /search?q=
const perplexityUrl = computed(
  () => `https://www.perplexity.ai/search/?q=${encodeURIComponent(prompt.value)}`
)

// ✅ Gemini (opens app and copies prompt to clipboard for quick paste)
const geminiUrl = computed(() => 'https://gemini.google.com/app')
async function goGemini() {
  if (typeof window === 'undefined') return
  try { await navigator.clipboard.writeText(prompt.value) } catch {}
  window.open(geminiUrl.value, '_blank', 'noopener,noreferrer')
}

const goClaude = () => window.open(claudeUrl.value, '_blank', 'noopener')
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton variant="ghost" size="sm" class="gap-2">
        <SmartIcon name="lucide:sparkles" :size="16" />
        <span class="hidden sm:inline">Ask AI about this page</span>
      </UiButton>
    </UiDropdownMenuTrigger>

    <UiDropdownMenuContent align="end" class="min-w-48">
      <UiDropdownMenuLabel class="text-xs">Send this page</UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />

      <!-- OpenAI -->
      <UiDropdownMenuItem as-child>
        <a :href="openaiUrl" target="_blank" rel="noopener" class="flex items-center gap-2">
          <SmartIcon name="simple-icons:openai" :size="16" />
          <span>OpenAI (ChatGPT)</span>
        </a>
      </UiDropdownMenuItem>

      <!-- Anthropic -->
      <UiDropdownMenuItem @select.prevent="goClaude">
        <div class="flex items-center gap-2">
          <SmartIcon name="simple-icons:anthropic" :size="16" />
          <span>Anthropic (Claude)</span>
        </div>
      </UiDropdownMenuItem>

      <!-- Perplexity -->
      <UiDropdownMenuItem as-child>
        <a :href="perplexityUrl" target="_blank" rel="noopener" class="flex items-center gap-2">
          <SmartIcon name="simple-icons:perplexity" :size="16" />
          <span>Perplexity</span>
        </a>
      </UiDropdownMenuItem>

      <!-- Google Gemini -->
      <UiDropdownMenuItem @select.prevent="goGemini">
        <div class="flex items-center gap-2">
          <SmartIcon name="simple-icons:google" :size="16" />
          <span>Google (Gemini)</span>
        </div>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>







