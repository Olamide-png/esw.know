import { defineCollection, defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    docs: defineCollection({ type: 'page', source: 'content/docs' }),
    blog: defineCollection({ type: 'page', source: 'content/blog' }),
  }
})
