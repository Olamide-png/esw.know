<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Fetch current page's content document by route path
const { data: page } = await useAsyncData(
  () => `content:page:${route.fullPath}`,
  () => queryContent(route.path).findOne(),
  { watch: [() => route.fullPath] }
)

// Build an absolute URL that works in SSR and client
const reqURL = useRequestURL()
const origin = `${reqURL.protocol}//${reqURL.host}`
const absoluteUrl = computed(() =>
  // On client, prefer window.location.origin; on SSR, fall back to request origin
  (process.client ? window.location.origin : origin) + route.fullPath
)

const titleFromPage = computed(() =>
  (page.value?.title as string) ||
  (page.value?.head as any)?.title ||
  'this page'
)

const prompt = computed(() =>
  `Please fetch and read "${titleFromPage.value}" from ${absoluteUrl.value}
So I can ask questions about it.`
)

const openaiUrl = computed(
  () => `https://chat.openai.com/?q=${encodeURIComponent(prompt.value)}`
)

const claudeUrl = computed(
  () => `https://claude.ai/new?q=${encodeURIComponent(prompt.value)}`
)

const perplexityUrl = computed(
  () => `https://www.perplexity.ai/search/?q=${encodeURIComponent(prompt.value)}`
)

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
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>













































