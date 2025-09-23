// composables/useShikiHighlighter.ts
let _highlighter: any | null = null
let _ready: Promise<any> | null = null

export async function useShikiHighlighter() {
  if (_highlighter) return _highlighter
  if (_ready) return _ready

  _ready = (async () => {
    const { getHighlighter } = await import('shiki')
    // Import explicit theme + langs so Vite bundles them
    const githubDark = (await import('shiki/themes/github-dark-default.mjs')).default
    const githubLight = (await import('shiki/themes/github-light-default.mjs')).default
    const bash = (await import('shiki/langs/bash.mjs')).default
    const json = (await import('shiki/langs/json.mjs')).default

    const highlighter = await getHighlighter({
      themes: [githubDark, githubLight],
      langs: [bash, json],
    })

    _highlighter = highlighter
    return highlighter
  })()

  return _ready
}
