/**
 * Registers <GlossaryInline> if the component file exists.
 * If it's missing (e.g. different branch or case mismatch), the build won't fail.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    // dynamic import so Vite doesn't resolve at build time
    const mod = await import('~/components/GlossaryInline.client.vue')
    // defensive: only register if default export exists
    if (mod && mod.default) {
      nuxtApp.vueApp.component('GlossaryInline', mod.default)
    }
  } catch (e) {
    // keep deploys green when the component isn't present
    console.warn('[glossary] GlossaryInline.client.vue not found; skipping registration')
  }
})
