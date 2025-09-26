type SearchInput = { q: string; mode: 'list'|'summarize' }
type SearchItem = { name?: string; title?: string; url: string }
type SearchOutput = { items?: SearchItem[]; results?: SearchItem[]; sources?: SearchItem[] }

export async function search({ q, mode }: SearchInput): Promise<SearchOutput> {
  // Minimal stub so your UI always works.
  // Replace with your real indexer later (filesystem, DB, Algolia, etc).

  if (mode === 'summarize') {
    // Summarize can just echo for now
    return {
      items: [
        { title: `Summary for: ${q}`, url: '#' }
      ],
      sources: []
    }
  }

  // "list" mode -> return a couple of fake hits
  return {
    items: [
      { title: `Result 1 for "${q}"`, url: '#' },
      { title: `Result 2 for "${q}"`, url: '#' }
    ],
    sources: []
  }
}

