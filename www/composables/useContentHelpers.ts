export function useContentHelpers() {
  function navKeyFromPath<T = any>(path: string, key: string, nav: any[] = []) {
    const stack = [...nav]
    while (stack.length) {
      const n = stack.shift()
      if (n?._path === path && n?.[key] != null) return n[key] as T
      if (Array.isArray(n?.children)) stack.unshift(...n.children)
    }
    return {} as Partial<T>
  }
  return { navKeyFromPath }
}
