import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxt/fonts'
  ],

  // Make your Markdown power the routes (so `/` renders your MD home)
  content: {
    documentDriven: true,
    // avoids native addon hassles; works on Vercel
    experimental: { sqliteConnector: 'native' }
  },

  // Keep existing code that calls useConfig() working in Nuxt 3
  imports: {
    presets: [
      { from: '#imports', imports: [{ name: 'useRuntimeConfig', as: 'useConfig' }] }
    ]
  }
})
