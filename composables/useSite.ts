// composables/useSite.ts
type UmamiCfg = { enable?: boolean; src?: string; dataWebsiteId?: string }
type SiteCfg = {
  url?: string; name?: string; description?: string;
  umami?: UmamiCfg;
}

export function useSite() {
  const app = useAppConfig()
  const r = useRuntimeConfig()

  // Sources
  const fromApp: SiteCfg = app?.shadcnDocs?.site ?? {}
  const fromRuntime: SiteCfg = (r?.public as any)?.site ?? {}

  // Merge with safe defaults
  const site: SiteCfg = {
    url: fromRuntime.url || fromApp.url || 'https://example.com',
    name: fromRuntime.name || fromApp.name || 'Site',
    description: fromRuntime.description || fromApp.description || '',
    umami: {
      enable: Boolean(fromApp.umami?.enable ?? fromRuntime.umami?.enable ?? false),
      src: fromApp.umami?.src || fromRuntime.umami?.src,
      dataWebsiteId: fromApp.umami?.dataWebsiteId || fromRuntime.umami?.dataWebsiteId,
    },
  }

  return site
}

