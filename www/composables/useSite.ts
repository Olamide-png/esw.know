export function useSite() {
  const app = useAppConfig() as any
  const site = computed(() => app?.shadcnDocs?.site ?? {
    name: 'Site',
    url: '/',
    description: ''
  })
  return site
}
