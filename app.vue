<template>
  <NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />

  <!-- Banner can render without page -->
  <Suspense>
    <LayoutBanner v-if="config.banner.enable" />
  </Suspense>

  <!-- Header sometimes reads nav/page-driven config -->
  <Suspense>
    <LayoutHeader />
  </Suspense>

  <!-- Main -->
  <div
    v-if="hasSidebar"
    class="min-h-screen border-b"
  >
    <div
      class="flex-1 items-start px-4 md:grid md:gap-6 md:px-8 lg:gap-10"
      :class="[
        config.main.padded && 'container',
        (page?.aside ?? true) && 'md:grid-cols-[300px_minmax(0,1.8fr)] lg:grid-cols-[340px_minmax(0,2.0fr)]'
      ]"
    >
      <aside
        v-if="page?.aside ?? true"
        class="fixed top-[102px] z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] md:w-[250px] lg:w-[320px] shrink-0 overflow-y-auto md:sticky md:top-[60px] md:block"
      >
        <Suspense>
          <LayoutAside :is-mobile="false" />
        </Suspense>
      </aside>

      <NuxtPage />
    </div>
  </div>

  <div v-else class="relative min-h-screen overflow-hidden">
    <!-- Only show SVG blob on index route -->
    <svg
      v-if="route.path === '/'"
      class="absolute top-0 right-0 -z-10 mix-blend-multiply"
      width="629"
      height="593"
      viewBox="0 0 629 593"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_f)">
        <path d="M628.5 -578L..." fill="#00DC82" fill-opacity="0.4" />
      </g>
      <defs>
        <filter id="filter0_f" x="0" y="-659" width="1255" height="1251" filterUnits="userSpaceOnUse">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="60" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>

    <NuxtPage />
  </div>

  <Toaster />

  <Suspense>
    <LayoutFooter />
  </Suspense>
</template>

<script setup lang="ts">
import { useConfig } from '#imports'
import { computed } from 'vue'
import Toaster from '@/components/ui/toast/Toaster.vue'

const config = useConfig()
const route = useRoute()
const { themeClass, radius } = useThemes()

// Content page (front-matter) — tolerate failures
const { data: page } = await useAsyncData(
  () => `content:page:${route.fullPath}`,
  async () => {
    try {
      // This pattern is robust with i18n and trailing slashes
      return await queryContent().where({ _path: route.path }).findOne()
    } catch {
      return null
    }
  },
  { watch: [() => route.fullPath] }
)

// Optional: hydrate <head> from front-matter only if we have a doc
if (page.value) {
  try { useContentHead(page.value as any) } catch {}
}

// Whether we render the two-column docs shell
const hasSidebar = computed(() => {
  const onHome = route.path === '/'
  const full = Boolean(page.value?.fullpage)
  return !onHome && !full
})

useSeoMeta({
  description: config.value.site.description,
  ogDescription: config.value.site.description,
  twitterCard: 'summary_large_image',
})

useServerHead({
  bodyAttrs: { class: themeClass.value, style: `--radius: ${radius.value}rem;` },
})

useHead({
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/ESW favicon.svg' }],
})
</script>























































