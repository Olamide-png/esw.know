// www/plugins/umami.client.ts
export default defineNuxtPlugin(() => {
  const site = useSite()
  const u = site.umami || {}

  if (!u.enable || !u.src || !u.dataWebsiteId) return

  // … inject Umami script with u.src & u.dataWebsiteId …
})


