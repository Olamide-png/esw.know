<script setup lang="ts">
import { ref } from 'vue'
import type { AskDocsRequest, AskDocsResponse } from '~/types/ask-docs'

const open = defineModel<boolean>({ default: false })
const busy = ref(false)
const question = ref('')
const path = ref<string | undefined>(undefined)
const err = ref('')
const answer = ref<string>('')
const cites = ref<AskDocsResponse['citations']>([])

async function ask() {
  err.value = ''
  answer.value = ''
  cites.value = []

  const scope = path.value && path.value.trim() ? path.value.trim() : undefined
  const payload: AskDocsRequest = {
    question: (question.value || '').trim(),
    path: scope,
    maxChars: 12000,
    k: 6
  }

  if (!payload.question) {
    err.value = 'Type a question first.'
    return
  }

  busy.value = true
  try {
    // use a type assertion instead of a generic to avoid <T> in SFCs
    const res = (await $fetch('/api/nl/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        ...payload,
        // send aliases too
        query: payload.question,
        q: payload.question,
        scope
      }
    })) as AskDocsResponse

    answer.value = res.answer ?? ''
    cites.value = res.citations ?? []
  } catch (e: any) {
    err.value =
      e?.data?.statusMessage ||
      e?.data?.message ||
      e?.message ||
      'Failed to ask docs'
  } finally {
    busy.value = false
  }
}
</script>


