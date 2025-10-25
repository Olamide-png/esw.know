// composables/useBreadcrumb.ts
interface BreadcrumbItem {
  title: string
  href: string
}

/**
 * Returns a ref of breadcrumb items for a given URL path.
 * No #content import. Queries @nuxt/content per segment.
 */
export function useBreadcrumb(url: string) {
  // normalize the path into segments
  const segments = url.split('/').filter(Boolean)

  const key = `breadcrumb:${url}`

  const { data } = useAsyncData<BreadcrumbItem[]>(
    key,
    async () => {
      const items: BreadcrumbItem[] = []
      let href = ''

      for (const raw of segments) {
        const seg = raw.replace('.html', '')
        href += `/${seg}`

        // fetch the doc for this path (title + path only)
        const doc = await queryContent()
          .where({ _path: href })
          .only(['title', '_path'])
          .findOne()

        items.push({
          title: doc?.title ?? seg,
          href
        })
      }

      return items
    },
    { watch: [() => url] }
  )

  // return a Ref<BreadcrumbItem[]>
  return data
}

