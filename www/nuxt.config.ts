// https://nuxt.com/docs/api/configuration/nuxt-config
// /www/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Inherit everything (including runtimeConfig) from the repo root
  extends: "./.nuxt/tsconfig.json",

  // If you’re using @nuxtjs/i18n via the root config/modules, this merges in cleanly.
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' },
    ],
  },

  nitro: {
    rollupConfig: {
      plugins: [
        process.env.VERCEL && {
          name: 'stub-vue-app-aliases-in-nitro',
          resolveId(id: string) {
            if (
              id === 'nuxt/app' ||
              id.startsWith('#app') ||      // includes '#app/config'
              id.startsWith('#build/')      // '#build/*' like app/nuxt.config/app.config
            ) {
              return '\0stub:' + id
            }
          },
          load(id: string) {
            if (!id.startsWith('\0stub:')) return
            const orig = id.slice('\0stub:'.length)

            // ----- build-time client files: provide empties -----
            if (orig === '#build/nuxt.config.mjs') return 'export default {}'
            if (orig === '#build/app.config.mjs')  return 'export default {}'

            // ----- server-safe stub for #app/config -----
            if (orig === '#app/config') {
              return `
                export default {}
                export const _replaceAppConfig = () => {}
                export const updateAppConfig = () => {}
                export const useAppConfig = () => ({})
              `
            }

            // ----- generic stubs for any other app alias pulled into server -----
            if (orig === 'nuxt/app' || orig.startsWith('#app')) {
              return `
                export default {}
                export const defineNuxtPlugin = () => {}
                export const useAppConfig = () => ({})
              `
            }

            return 'export default {}'
          }
        }
      ].filter(Boolean)
    }
  },

  // Lock features to a predictable baseline
  compatibilityDate: '2025-05-13',

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' },
      ],
    },
  },
})















