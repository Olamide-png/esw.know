// composables/useConfig.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

async function safeFetchNavigation() {
  try {
    // Works on SSR & CSR when @nuxt/content is installed
    return await $fetch<any[]>('/api/_content/navigation')
  } catch (e) {
    console.error('[content] navigation fetch failed:', e)
    return [] as any[]
  }
}

export function useConfig() {
  const appConfig = computed(() => useAppConfig()?.shadcnDocs || {})
  const route = useRoute()

  // Current page (front-matter) – tolerate errors
  const { data: page } = useAsyncData(
    () => `content:page:${route.fullPath}`,
    async () => {
      try {
        return await queryContent().where({ _path: route.path }).findOne()
      } catch (e) {
        console.error('[content] page query failed:', e)
        return {} as any
      }
    },
    { watch: [() => route.fullPath] }
  )

  // Full nav (SSR via Nitro endpoint; CSR too)
  const { data: navigation } = useAsyncData('content:navigation', safeFetchNavigation)

  // Replacement for navKeyFromPath
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
    const processed = customDefu(appConfig.value, defaultConfig)
    const nav = navigation.value || []
    const p = (page.value || {}) as any

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





