<!-- pages/nlweb-demo.vue -->
<script setup lang="ts">
import NlwebAskForm from '~/components/NlwebAskForm.vue'
import NlwebCard from '~/components/NlwebCard.vue'
import { useNlweb } from '~/composables/useNlweb'

const { ask, pending, error } = useNlweb()
const results = ref<Record<string, any>[]>([])
const lastQuery = ref('')

async function handleSubmit(payload: { query: string }) {
  lastQuery.value = payload.query
  results.value = await ask({ query: payload.query })
}
</script>

<template>
  <section class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">NLWeb Ask Demo</h1>

    <NlwebAskForm @submit="handleSubmit" />

    <p v-if="pending" class="mt-4 text-sm text-neutral-500">Asking NLWeb…</p>
    <p v-if="error" class="mt-4 text-sm text-rose-500">Error: {{ error }}</p>

    <div v-if="!pending && results.length" class="mt-6 grid gap-4">
      <div class="text-sm text-neutral-500">
        Showing {{ results.length }} result(s) for <span class="font-medium">“{{ lastQuery }}”</span>
      </div>
      <NlwebCard v-for="(item, i) in results" :key="i" :thing="item" />
    </div>

    <div v-else-if="!pending && !error" class="mt-6 text-sm text-neutral-500">
      Try queries like: <code>“What’s the returns policy?”</code>, <code>“Create a return label”</code>, <code>“Pricing rules”</code>
    </div>
  </section>
</template>
