export function chunkText(text: string, maxChars = 2800, overlap = 300): string[] {
  const out: string[] = []
  let i = 0
  if (!text) return out
  while (i < text.length) {
    out.push(text.slice(i, i + maxChars))
    i += Math.max(1, maxChars - overlap)
  }
  return out
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i]
    dot += x * y
    na += x * x
    nb += y * y
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}
