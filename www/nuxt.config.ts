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
            // Anything from the client-side Vue app that Nitro must not touch
            if (
              id === 'nuxt/app' ||
              id.startsWith('#app') ||
              id.startsWith('#build/')
            ) {
              return '\0stub:' + id
            }
          },
          load(id: string) {
            if (!id.startsWith('\0stub:')) return
            const orig = id.slice('\0stub:'.length)

            // Minimal, safe stubs per alias
            if (orig === '#build/nuxt.config.mjs') {
              // Server doesn't need the client app's nuxt.config
              return 'export default {}'
            }
            if (orig === '#build/app.config.mjs') {
              // Server doesn't need the client app-config either
              return 'export default {}'
            }
            if (orig === 'nuxt/app' || orig.startsWith('#app')) {
              // Block any other app-runtime imports in server
              return `
                export default {}
                export const defineNuxtPlugin = () => {}
                export const useAppConfig = () => ({})
              `
            }
            // Fallback
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















