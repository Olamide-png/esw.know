<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Uses your layer's auto-imported useContent()
const { page } = useContent()
const route = useRoute()

const prompt = computed(() => {
  const title = page.value?.title || page.value?.head?.title || 'this page'
  const url = typeof window !== 'undefined' ? `${location.origin}${route.fullPath}` : route.fullPath
  return `Please fetch and read "${title}" from ${url}
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

// ✅ Your on-site Chat page with prefilled prompt
// (If you want it to auto-send too, append &send=1)
const chatUrl = computed(() => `/chat?q=${encodeURIComponent(prompt.value)}`)

const goClaude = () => window.open(claudeUrl.value, '_blank', 'noopener')
</script>

<template>
  <!-- Wrap both controls so we can show dropdown + AI Chat link side by side -->
  <div class="flex items-center gap-2">
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
      </UiDropdownMenuContent>
    </UiDropdownMenu>

    <!-- Link to your on-site ChatGPT-style page (/chat) in a new tab with prefilled prompt -->
    <NuxtLink
      :to="chatUrl"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-muted"
    >
      <SmartIcon name="lucide:bot" :size="16" />
      <span class="hidden sm:inline">AI Chat</span>
    </NuxtLink>
  </div>
</template>
















