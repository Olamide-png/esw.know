/**
 * Registers <GlossaryInline> only if the file exists.
 * Uses import.meta.glob so missing files don't fail build.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  // Match the exact component, if present. If it's missing, this is just {}.
  const matches = import.meta.glob('~/components/GlossaryInline.client.vue')

  const keys = Object.keys(matches)
  if (!keys.length) {
    console.warn('[glossary] GlossaryInline.client.vue not found; skipping registration')
    return
  }

  try {
    // Load the first (and only) match
    const load = matches[keys[0]]
    const mod = await load()
    if (mod && mod.default) {
      nuxtApp.vueApp.component('GlossaryInline', mod.default)
    }
  } catch (e) {
    console.warn('[glossary] Failed to load GlossaryInline.client.vue; skipping', e)
  }
})
