export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    const mod = await import('~/components/GlossaryInline.client.vue')
    nuxtApp.vueApp.component('GlossaryInline', mod.default)
  } catch {
    console.warn('[glossary] GlossaryInline.client.vue not found; skipping registration')
  }
})
