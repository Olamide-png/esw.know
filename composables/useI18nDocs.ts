// composables/useI18nDocs.ts
import type { SearchResult } from 'minisearch'
import { useRoute } from 'vue-router'

export function useI18nDocs() {
  // i18n (safe if module missing)
  const i18n = (useI18n as any)?.() || {}
  const i18nEnabled = !!i18n.availableLocales && i18n.availableLocales.length > 1

  const locale = i18n.locale ?? ref('en')
  const locales = i18n.locales ?? ref([])
  const defaultLocale = i18n.defaultLocale ?? 'en'
  const availableLocales = i18n.availableLocales ?? []
  const otherLocales = availableLocales.filter((l: string) => l !== defaultLocale)

  const localePath = i18nEnabled ? useLocalePath() : ((p: string) => p)
  const switchLocalePath = (useSwitchLocalePath as any)?.() ?? ((l: string) => (_p?: string) => '/')

  const route = useRoute()

  /* ---------------- Navigation ---------------- */
  const { data: rawNavigation } = useAsyncData(
    'content-navigation',
    () => fetchContentNavigation(), // full tree; we’ll filter below
    { server: true }
  )

  const localizedNavigation = computed(() => {
    const nav = rawNavigation.value || []
    if (!i18nEnabled) return nav

    if (locale.value === defaultLocale) {
      // remove any nodes that live under /<other-locale>/**
      return nav.filter((n: any) => !otherLocales.some((l: string) => n._path?.startsWith(`/${l}`)))
    }

    // keep only nodes under /<locale>/** and, if the root node is the locale,
    // show its children for a nicer top-level
    const filtered = nav.filter((n: any) => n._path?.startsWith(`/${locale.value}`))
    // If the first filtered node is exactly "/<locale>", return its children
    if (filtered[0]?._path === `/${locale.value}` && filtered[0]?.children?.length) {
      return filtered[0].children
    }
    return filtered
  })

  /* ---------------- Prev / Next ---------------- */
  const { data: surround } = useAsyncData(
    () => `content-surround-${locale.value}-${route.fullPath}`,
    async () => {
      // Ask Content for prev/next around the current path.
      // We’ll filter by locale after we get them.
      const res = await queryContent()
        .only(['_path', 'title'])
        .findSurround(route.path)
      // res is [prev|null, next|null]
      return res || [null, null]
    },
    { watch: [() => route.fullPath, () => locale.value] }
  )

  const localizedPrev = computed(() => {
    const prev = surround.value?.[0] || null
    if (!i18nEnabled) return prev
    if (!prev) return null

    if (locale.value === defaultLocale) {
      return otherLocales.some((l: string) => prev._path?.startsWith(`/${l}/`)) ? null : prev
    }
    return prev._path?.startsWith(`/${locale.value}/`) ? prev : null
  })

  const localizedNext = computed(() => {
    const next = surround.value?.[1] || null
    if (!i18nEnabled) return next
    if (!next) return null

    if (locale.value === defaultLocale) {
      return otherLocales.some((l: string) => next._path?.startsWith(`/${l}/`)) ? null : next
    }
    return next._path?.startsWith(`/${locale.value}/`) ? next : null
  })

  /* ---------------- Search results filter ---------------- */
  const localizeSearchResult = i18nEnabled
    ? (result: SearchResult[]) => {
        if (locale.value === defaultLocale) {
          return result.filter(r => !otherLocales.some((l: string) => r.id.startsWith(`/${l}/`)))
        }
        return result.filter(r => r.id.startsWith(`/${locale.value}/`))
      }
    : (result: SearchResult[]) => result

  return {
    i18nEnabled,
    locale,
    locales,
    defaultLocale,
    availableLocales,
    otherLocales,

    navigation: localizedNavigation,
    prev: localizedPrev,
    next: localizedNext,

    localePath,
    switchLocalePath,

    localizeSearchResult
  }
}

