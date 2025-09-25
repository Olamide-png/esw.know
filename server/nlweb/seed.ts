import type { CanonicalThing } from './types'

// TODO: replace with real docs extraction (sitemap/MD/JSON-LD)
export const SEED_THINGS: CanonicalThing[] = [
  {
    id: 'rounding-rules',
    url: 'https://yoursite/docs/rounding',
    name: 'Rounding Rules',
    description: 'Configure rounding behaviour for calculated pricing.',
    text: `
# Rounding Rules
Configured in Business Manager → Custom Objects → ESW_PA_DATA → ESW Rounding Rules.
These rules apply to calculated pricing model only.
`,
    type: 'Article',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'localized-pricebooks',
    url: 'https://yoursite/docs/price-books',
    name: 'Localized Price Books',
    description: 'Generate country-specific price books with FX, uplifts, duties, taxes, and rounding.',
    text: `
# Localized Price Books
The job eswRetailerLocalizedPricing assigns converted prices to local price books, exports for marketplaces, and applies Pricing Advisor outputs.
`,
    type: 'Article',
    updatedAt: new Date().toISOString()
  }
]
