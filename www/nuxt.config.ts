import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxt/fonts'
  ],

  // let Content turn markdown into routes (so "/" => content/index.md)
  content: {
    documentDriven: true,
    experimental: { sqliteConnector: 'native' } // avoids native addon headaches
  },

  // keep any legacy useConfig() calls working
  imports: {
    presets: [
      { from: '#imports', imports: [{ name: 'useRuntimeConfig', as: 'useConfig' }] }
    ]
  }
})

