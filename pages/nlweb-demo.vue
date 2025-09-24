<script setup lang="ts">
const q = ref('latest Apple Watch announcements')
const items = ref<any[]>([])
const { ask, pending, error } = useAsk()

async function run() {
  items.value = await ask({ query: q.value, limit: 5 })
}
</script>

<template>
  <section class="max-w-4xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-semibold">NLWeb Ask (Vercel-native)</h1>

    <form @submit.prevent="run" class="flex gap-2">
      <input v-model="q" type="text" class="flex-1 border rounded-lg px-3 py-2"
             placeholder="Ask something…">
      <button class="rounded-lg px-4 py-2 bg-black text-white" :disabled="pending">
        {{ pending ? 'Thinking…' : 'Ask' }}
      </button>
    </form>

    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <div v-if="items.length" class="grid gap-4">
      <article v-for="(it, i) in items" :key="i" class="rounded-xl border p-4">
        <div class="flex items-start gap-3">
          <div class="text-xs uppercase px-2 py-1 rounded bg-gray-100">
            {{ it['@type'] || 'Thing' }}
          </div>
          <h2 class="text-lg font-medium">{{ it.name || it.headline || it.question || 'Untitled' }}</h2>
        </div>

        <p v-if="it.description || it.abstract" class="mt-2 text-gray-600">
          {{ it.description || it.abstract }}
        </p>

        <div class="mt-3 grid gap-2 text-sm">
          <div v-if="it.url">🔗 <a :href="it.url" target="_blank" class="underline break-all">{{ it.url }}</a></div>
          <div v-if="it.datePublished || it.startDate">🗓️ {{ it.datePublished || it.startDate }}</div>
          <div v-if="it.offers?.price">💲 {{ it.offers.price }} <span v-if="it.offers.priceCurrency">{{ it.offers.priceCurrency }}</span></div>
          <div v-if="it.aggregateRating?.ratingValue">⭐ {{ it.aggregateRating.ratingValue }} / {{ it.aggregateRating.bestRating || 5 }}</div>
        </div>

        <img v-if="it.image" :src="Array.isArray(it.image) ? it.image[0] : it.image"
             alt="" class="mt-3 rounded-lg max-h-56 object-cover">
      </article>
    </div>
  </section>
</template>
