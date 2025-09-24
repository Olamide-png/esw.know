<!-- components/NlwebCard.vue -->
<script setup lang="ts">
const props = defineProps<{ thing: Record<string, any> }>()
const t = computed(() => props.thing || {})

function first<T = any>(...vals: any[]): T | undefined {
  for (const v of vals) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v)) return (v[0] as T) ?? undefined
    return v as T
  }
}

const type = computed(() => first(t.value['@type'], t.value.type, 'Thing'))
const name = computed(() => first(t.value.name, t.value.headline, t.value.question))
const description = computed(() => first(t.value.description, t.value.abstract, t.value.text))
const url = computed(() => first(t.value.url, t.value.mainEntityOfPage, t.value['@id']))
const image = computed(() => {
  const img = first<any>(t.value.image, t.value.thumbnailUrl, t.value.logo)
  if (!img) return undefined
  return typeof img === 'string' ? img : (img.url || img.contentUrl)
})

// Type-specific details
const when = computed(() => first(t.value.datePublished, t.value.dateCreated, t.value.startDate))
const where = computed(() => {
  const loc = first<any>(t.value.location, t.value.eventAttendanceMode, t.value.contentLocation)
  if (!loc) return undefined
  if (typeof loc === 'string') return loc
  return loc.name || loc.address || loc.url
})
const price = computed(() => {
  const offers = first<any>(t.value.offers)
  if (!offers) return undefined
  const p = offers.price || offers.lowPrice || offers.highPrice
  return p ? `${p} ${offers.priceCurrency || ''}`.trim() : undefined
})
const qa = computed(() => {
  // QAPage or FAQPage structures
  const main = t.value.mainEntity
  if (Array.isArray(main)) return main
  if (main) return [main]
  return []
})
</script>

<template>
  <article class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 shadow-sm overflow-hidden">
    <div class="p-4 md:p-6">
      <div class="flex items-start gap-4">
        <div class="min-w-0 flex-1">
          <div class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{{ type }}</div>
          <h3 class="mt-1 text-lg font-semibold">
            <a v-if="url" :href="url" target="_blank" rel="noreferrer" class="hover:underline">{{ name || '(no title)' }}</a>
            <span v-else>{{ name || '(no title)' }}</span>
          </h3>
          <p v-if="description" class="mt-2 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-4">{{ description }}</p>

          <div class="mt-3 flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <span v-if="when" class="inline-flex items-center rounded-full border px-2 py-1 border-neutral-200 dark:border-neutral-800">📅 {{ when }}</span>
            <span v-if="where" class="inline-flex items-center rounded-full border px-2 py-1 border-neutral-200 dark:border-neutral-800">📍 {{ where }}</span>
            <span v-if="price" class="inline-flex items-center rounded-full border px-2 py-1 border-neutral-200 dark:border-neutral-800">💰 {{ price }}</span>
          </div>

          <!-- Q&A rendering (FAQPage/QAPage) -->
          <div v-if="qa.length" class="mt-4 space-y-3">
            <div v-for="(q, i) in qa" :key="i" class="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
              <p class="font-medium">{{ q.name || q.text }}</p>
              <p v-if="q.acceptedAnswer?.text" class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {{ q.acceptedAnswer.text }}
              </p>
            </div>
          </div>
        </div>
        <img
          v-if="image"
          :src="image"
          alt=""
          class="hidden md:block w-28 h-28 object-cover rounded-xl border border-neutral-200 dark:border-neutral-800"
          loading="lazy"
        />
      </div>
    </div>
  </article>
</template>
