<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
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

// --- Toggle & selection memory (Perplexity-only) ---
const useSelection = ref(false)       // ← toggle is OFF by default
const lastSelection = ref('')         // ← remembers the last non-empty selection

function captureSelection() {
  if (typeof window === 'undefined') return
  const sel = window.getSelection()?.toString().trim() || ''
  if (sel) lastSelection.value = sel
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('selectionchange', captureSelection)
  }
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('selectionchange', captureSelection)
  }
})

// Build Perplexity prompt with (optional) selection
const promptWithSelection = computed(() => {
  if (!useSelection.value) return prompt.value
  const sel =
    (typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : '') ||
    lastSelection.value
  if (!sel) return prompt.value
  return `${prompt.value}\n\nFocus on this selection:\n"${sel}"`
})

// ✅ Prefill Perplexity via /search?q= (uses selection when toggled on)
const perplexityUrl = computed(
  () => `https://www.perplexity.ai/search/?q=${encodeURIComponent(promptWithSelection.value)}`
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

      <UiDropdownMenuSeparator />
      <UiDropdownMenuLabel class="text-xs">Options</UiDropdownMenuLabel>

      <!-- Toggle: Use selected text (Perplexity only) -->
      <!-- If your shadcn layer supports checkbox items: -->
      <UiDropdownMenuCheckboxItem v-model:checked="useSelection" @click.stop>
        <div class="flex items-center justify-between w-full gap-3">
          <span>Use selected text</span>
          <span class="text-xs text-muted-foreground">
            {{ useSelection ? 'On' : 'Off' }}
          </span>
        </div>
      </UiDropdownMenuCheckboxItem>

      <!-- If CheckboxItem isn’t available in your build, you can swap the block above with:
      <UiDropdownMenuItem @click.stop.prevent="useSelection = !useSelection">
        <div class="flex items-center justify-between w-full gap-3">
          <span>Use selected text</span>
          <UiBadge variant="secondary">{{ useSelection ? 'On' : 'Off' }}</UiBadge>
        </div>
      </UiDropdownMenuItem>
      -->
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>









