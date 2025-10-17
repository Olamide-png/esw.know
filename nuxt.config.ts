// nuxt.config.ts
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  devtools: { enabled: true },
  builder: 'vite',

  runtimeConfig: {
    TRYIT_ALLOWED_HOSTS: process.env.TRYIT_ALLOWED_HOSTS || '',
    nlwebBaseUrl: process.env.NLWEB_BASE_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,          // <— no "|| ''"
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    embedModel: process.env.EMBED_MODEL || 'text-embedding-3-small',
    chunkMaxChars: Number(process.env.CHUNK_MAX_CHARS || 2800),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP || 300),
    nlwebTimeoutMs: Number(process.env.NLWEB_TIMEOUT_MS || 20000),
    public: {
      TRYIT_LABELS: process.env.TRYIT_LABELS || '',
      TRYIT_BASEURLS: process.env.TRYIT_BASEURLS || ''
    }
  },

  nitro: {
    routeRules: {
      // Force Node runtime for AI/backend routes
      '/api/nlweb/**': { cors: true, headers: { 'Cache-Control': 'no-store' }, experimental: { wasm: false } }
      // If you ever want a blanket rule:
      // '/api/**': { runtime: 'node' }
    }
  },

  modules: [
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@ztl-uwu/nuxt-content',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    'nuxt-og-image',
    '@nuxt/scripts',
    '@nuxtjs/i18n',
    '@nuxt/fonts'
  ],

  shadcn: {
    prefix: 'Ui',
    componentDir: join(currentDir, './components/ui')
  },

  components: {
    dirs: [{ path: './components', ignore: ['**/*.ts'] }]
  },

  i18n: {
    bundle: { optimizeTranslationDirective: false },
    strategy: 'prefix_except_default'
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    detectBrowserColorScheme: false,
    classSuffix: '',
    disableTransition: true
  },

  css: [
    ~/assets/css/tailwind.css',
    '~/assets/css/themes.css', 
  ],

  content: {
    documentDriven: true,
    highlight: {
      theme: { default: 'light-plus', dark: 'aurora-x' },
      preload: [
        'json','js','ts','html','css','vue','diff','shell','markdown','mdc','yaml','bash',
        'ini','dotenv','python','xml','dockerfile','sql','graphql','csharp','java','php',
        'ruby','go','rust','kotlin','swift'
      ]
    },
    navigation: {
      fields: ['icon','navBadges','navTruncate','badges','toc','sidebar','collapse','editLink','prevNext','breadcrumb','fullpage']
    },
    experimental: { search: { indexed: true } }
  },

  icon: { clientBundle: { scan: true, sizeLimitKb: 512 } },
  fonts: { defaults: { weights: ['300 800'] } },
  typescript: { tsConfig: { compilerOptions: { baseUrl: '.' } } },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': currentDir,
        '@': currentDir,
        '~assets': join(currentDir, 'assets')
      }
    }
  },

  compatibilityDate: '2025-05-13',

  app: {
    head: {
      link: [
        { rel: 'preconnect',  href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' }
      ]
    }
  }
})















































































































































































































































































