type SearchInput = { q: string; mode: 'list'|'summarize' }
type SearchItem = { title?: string; name?: string; url: string }
type SearchOutput = { items?: SearchItem[]; results?: SearchItem[]; sources?: SearchItem[] }

export async function search({ q, mode }: SearchInput): Promise<SearchOutput> {
  if (mode === 'summarize') {
    return { items: [{ title: `Summary for: ${q}`, url: '#' }], sources: [] }
  }
  return {
    items: [
      { title: `Result 1 for "${q}"`, url: '#' },
      { title: `Result 2 for "${q}"`, url: '#' }
    ],
    sources: []
  }
}


