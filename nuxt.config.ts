// nuxt.config.ts (root)
import tailwindcss from '@tailwindcss/vite' // ✅ import the plugin (ESM)

export default defineNuxtConfig({
  // Treat /www as the app
  srcDir: 'www',

  devtools: { enabled: true },
  builder: 'vite',

  runtimeConfig: {
    TRYIT_ALLOWED_HOSTS: process.env.TRYIT_ALLOWED_HOSTS || '',
    nlwebBaseUrl: process.env.NLWEB_BASE_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    embedModel: process.env.EMBED_MODEL || 'text-embedding-3-small',
    chunkMaxChars: Number(process.env.CHUNK_MAX_CHARS || 2800),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP || 300),
    nlwebTimeoutMs: Number(process.env.NLWEB_TIMEOUT_MS || 20000),
    public: {
      TRYIT_LABELS: process.env.TRYIT_LABELS || '',
      TRYIT_BASEURLS: process.env.TRYIT_BASEURLS || '',
    },
  },

  nitro: {
    routeRules: {
      '/api/nlweb/**': { cors: true, headers: { 'Cache-Control': 'no-store' }, experimental: { wasm: false } },
    },
  },

  modules: [
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    'nuxt-og-image',
    '@nuxt/scripts',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
  ],

  shadcn: {
    prefix: 'Ui',
    componentDir: 'components/ui',
  },

  components: {
    dirs: [
      { path: 'components', pathPrefix: false, ignore: ['**/*.ts'] },
      { path: 'components/ui', pathPrefix: false, ignore: ['**/*.ts'] },
    ],
  },

  i18n: {
    bundle: { optimizeTranslationDirective: false },
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' },
    ],
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    detectBrowserColorScheme: false,
    classSuffix: '',
    disableTransition: true,
  },

  css: [
    '~/assets/css/tailwind.css',
    '~/assets/css/themes.css',
  ],

  content: {
    documentDriven: true,
    markdown: { mdc: true },
    highlight: {
      theme: { default: 'light-plus', dark: 'aurora-x' },
      preload: [
        'json','js','ts','html','css','vue','diff','shell','markdown','mdc','yaml','bash',
        'ini','dotenv','python','xml','dockerfile','sql','graphql','csharp','java','php',
        'ruby','go','rust','kotlin','swift'
      ],
    },
    navigation: {
      fields: ['icon','navBadges','navTruncate','badges','toc','sidebar','collapse','editLink','prevNext','breadcrumb','fullpage'],
    },
    experimental: { search: { indexed: false } },
  },

  icon: { clientBundle: { scan: true, sizeLimitKb: 512 } },
  fonts: { defaults: { weights: ['300 800'] } },

  vite: {
    plugins: [tailwindcss()], // ✅ call the imported function
  },

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






