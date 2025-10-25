// composables/useConfig.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** Get full content navigation without statically importing #content */
async function getNavigation() {
  // On server, dynamically import the server helper
  if (process.server) {
    const mod = await import('#content') as any
    return mod.fetchContentNavigation()
  }
  // On client, call the Nuxt Content built-in endpoint
  return $fetch('/api/_content/navigation')
}

export function useConfig() {
  const appConfig = computed(() => useAppConfig()?.shadcnDocs || {})
  const route = useRoute()

  // current page doc (front-matter) for the current route
  const { data: page } = useAsyncData(
    () => `content:page:${route.fullPath}`,
    () => queryContent().where({ _path: route.path }).findOne(),
    { watch: [() => route.fullPath] }
  )

  // full nav (SSR via server helper, CSR via endpoint)
  const { data: navigation } = useAsyncData('content:navigation', getNavigation)

  // ----- same as you had -----
  function navKeyFromPath<T = any>(path: string, key: string, nav: any[] | null | undefined): Partial<T> {
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

    const headerNav = navKeyFromPath<typeof processed.header>(route.path, 'header', nav)
    const bannerNav = navKeyFromPath<typeof processed.banner>(route.path, 'banner', nav)
    const mainNav   = navKeyFromPath<typeof processed.main>(route.path, 'main', nav)
    const asideNav  = navKeyFromPath<typeof processed.aside>(route.path, 'aside', nav)
    const tocNav    = navKeyFromPath<typeof processed.toc>(route.path, 'toc', nav)
    const footerNav = navKeyFromPath<typeof processed.footer>(route.path, 'footer', nav)

    const p = page.value || {}

    return {
      ...appConfig.value,
      ...processed,
      header: { ...processed.header, ...headerNav, ...(p.header || {}) } as typeof processed.header,
      banner: { ...processed.banner, ...bannerNav, ...(p.banner || {}) } as typeof processed.banner,
      main:   { ...processed.main,   ...mainNav,   ...(p.main   || {}) } as typeof processed.main,
      aside:  { ...processed.aside,  ...asideNav,  ...(p.aside  || {}) } as typeof processed.aside,
      toc:    { ...processed.toc,    ...tocNav,    ...(p.toc    || {}) } as typeof processed.toc,
      footer: { ...processed.footer, ...footerNav, ...(p.footer || {}) } as typeof processed.footer,
    }
  })
}


