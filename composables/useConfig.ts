// composables/useConfig.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// ⛔️ Do NOT import from `#content` here.

// Fetch the content navigation without touching `#content`
async function fetchNavigation() {
  // Works on both server and client
  return await $fetch<any[]>('/api/_content/navigation')
}

export function useConfig() {
  // Your app-level config stays the same
  const appConfig = computed(() => useAppConfig()?.shadcnDocs || {})
  const route = useRoute()

  // Current page front-matter (uses queryContent only)
  const { data: page } = useAsyncData(
    () => `content:page:${route.fullPath}`,
    () => queryContent().where({ _path: route.path }).findOne(),
    { watch: [() => route.fullPath] }
  )

  // Full navigation tree (public endpoint; no #content import)
  const { data: navigation } = useAsyncData('content:navigation', fetchNavigation)

  // Minimal replacement for useContentHelpers().navKeyFromPath
  function navKeyFromPath<T = any>(
    path: string,
    key: string,
    nav: any[] | null | undefined
  ): Partial<T> {
    if (!Array.isArray(nav)) return {}
    const stack: any[] = [...nav]
    while (stack.length) {
      const node = stack.shift()
      if (node?._path === path && node?.[key] != null) return node[key] as T
      if (Array.isArray(node?.children)) stack.push(...node.children)
    }
    return {}
  }

  return computed(() => {
    // `customDefu` and `defaultConfig` are the same ones you already have defined.
    // (If they live in another file, import them from there.)
    const processed = customDefu(appConfig.value, defaultConfig)
    const nav = navigation.value || []
    const p: any = page.value || {}

    return {
      ...appConfig.value,
      ...processed,

      header: { ...processed.header, ...navKeyFromPath(route.path, 'header', nav), ...(p.header || {}) } as typeof processed.header,
      banner: { ...processed.banner, ...navKeyFromPath(route.path, 'banner', nav), ...(p.banner || {}) } as typeof processed.banner,
      main:   { ...processed.main,   ...navKeyFromPath(route.path, 'main', nav),   ...(p.main   || {}) } as typeof processed.main,
      aside:  { ...processed.aside,  ...navKeyFromPath(route.path, 'aside', nav),  ...(p.aside  || {}) } as typeof processed.aside,
      toc:    { ...processed.toc,    ...navKeyFromPath(route.path, 'toc', nav),    ...(p.toc    || {}) } as typeof processed.toc,
      footer: { ...processed.footer, ...navKeyFromPath(route.path, 'footer', nav), ...(p.footer || {}) } as typeof processed.footer,
    }
  })
}




