// composables/useEditLink.ts
export function useEditLink() {
  const route = useRoute()
  const { value: cfg } = useConfig()

  const { data: page } = useAsyncData(
    () => `content:page:${route.fullPath}`,
    () => queryContent().where({ _path: route.path }).only(['_file','editLink']).findOne(),
    { watch: [() => route.fullPath] }
  )

  const { enable, pattern, text, icon, placement } = cfg.main.editLink

  const url = computed(() =>
    pattern.replace(/:path/g, page.value?._file ?? '')
  )

  const enabled = computed(() =>
    enable && page.value?.editLink !== false && page.value?._file && url.value !== ''
  )

  const enabledToc = computed(() => enabled.value && placement.includes('toc'))
  const enabledDocsFooter = computed(() => enabled.value && placement.includes('docsFooter'))

  return { url, text, icon, enabledToc, enabledDocsFooter }
}

