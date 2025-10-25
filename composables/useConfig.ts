// composables/useContent.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

type NavNode = {
  _path: string
  title?: string
  children?: NavNode[]
  [k: string]: any
}

function flatten(nav: NavNode[] = []) {
  const out: NavNode[] = []
  const stack = [...nav]
  while (stack.length) {
    const n = stack.shift()!
    out.push(n)
    if (Array.isArray(n.children)) stack.unshift(...n.children)
  }
  return out
}

// SSR: call module helper; CSR: call the API
async function fetchNavigation() {
  if (process.server) {
    const mod = await import('#content') as any
    return mod.fetchContentNavigation()
  }
  return $fetch<NavNode[]>('/api/_content/navigation')
}

export function useContent() {
  const route = useRoute()

  // current page doc
  const { data: page } = useAsyncData(
    () => `content:page:${route.fullPath}`,
    () => queryContent().where({ _path: route.path }).findOne(),
    { watch: [() => route.fullPath] }
  )

  // full navigation
  const { data: navigation } = useAsyncData('content:navigation', fetchNavigation)

  // prev/next from flat nav order
  const flat = computed(() => flatten(navigation.value || []))
  const index = computed(() => flat.value.findIndex(n => n._path === route.path))
  const prev  = computed(() => (index.value > 0 ? flat.value[index.value - 1] : null))
  const next  = computed(() => (index.value >= 0 && index.value < flat.value.length - 1 ? flat.value[index.value + 1] : null))

  // toc: prefer page.front-matter, else build shallow from headings if present
  const toc = computed(() => (page.value?.toc ? page.value.toc : { links: [] }))

  return {
    // api shape compatible with the old @nuxt/content composable
    page,            // Ref<any|null>
    navigation,      // Ref<NavNode[]|null>
    prev,            // Ref<NavNode|null>
    next,            // Ref<NavNode|null>
    toc              // Ref<{ links: any[] }>
  }
}






