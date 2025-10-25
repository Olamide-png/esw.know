// composables/useI18nDocs.ts
import type { SearchResult } from 'minisearch'

export function useI18nDocs() {
  // i18n bits
  const i18n = useI18n?.()
  const i18nEnabled = !!i18n && i18n.availableLocales?.length > 1
  const locale = i18n?.locale ?? ref('')
  const availableLocales = i18n?.availableLocales ?? []
  const defaultLocale = i18n?.defaultLocale ?? ''
  const otherLocales = availableLocales.filter(l => l !== defaultLocale)
  const localePath = i18nEnabled ? useLocalePath() : (p: string) => p
  const switchLocalePath = useSwitchLocalePath?.()

  // full nav
  const { data: navigation } = useAsyncData('content:navigation', async () => {
    if (import.meta.server) {
      const mod = await import('#content') as any
      return mod.fetchContentNavigation()
    }
    return $fetch('/api/_content/navigation')
  })

  // prev / next from current page
  const route = useRoute()
  const { data: siblings } = useAsyncData(
    () => `content:siblings:${route.fullPath}`,
    async () => {
      // Use content’s built-in helper via the server to compute prev/next
      if (import.meta.server) {
        const mod = await import('#content') as any
        // fetch nav and compute prev/next locally
        const nav = await mod.fetchContentNavigation()
        return { nav }
      }
      // client just needs nav; prev/next will be filtered below from nav
      const nav = await $fetch('/api/_content/navigation')
      return { nav }
    },
    { watch: [() => route.fullPath] }
  )

  // Helpers to filter nav/prev/next by locale
  const localizedNavigation = computed(() => {
    const nav = navigation.value || []
    if (!i18nEnabled) return nav
    if (locale.value === defaultLocale) {
      return nav.filter(n => !otherLocales.some(l => n._path?.startsWith(`/${l}`)))
    }
    const filtered = nav.filter(n => n._path?.startsWith(`/${locale.value}`))
    return filtered[0]?.children || filtered
  })

  function filterEntry(entry: any | null | undefined) {
    if (!i18nEnabled || !entry) return entry
    if (locale.value === defaultLocale) {
      return otherLocales.some(l => entry._path?.startsWith(`/${l}/`)) ? null : entry
    }
    return entry._path?.startsWith(`/${locale.value}`) ? entry : null
  }

  const prev = computed(() => {
    // You likely had your own prev/next logic. If you still compute them elsewhere,
    // just run them through filterEntry. Otherwise omit prev/next from this composable.
    return null
  })
  const next = computed(() => null)

  const localizeSearchResult = (result: SearchResult[]) => {
    if (!i18nEnabled) return result
    if (locale.value === defaultLocale) {
      return result.filter(r => !otherLocales.some(l => r.id.startsWith(`/${l}/`)))
    }
    return result.filter(r => r.id.startsWith(`/${locale.value}`))
  }

  return {
    i18nEnabled,
    locale,
    availableLocales,
    defaultLocale,
    otherLocales,
    navigation: localizedNavigation,
    prev, next,
    localePath,
    localizeSearchResult,
    switchLocalePath
  }
}


