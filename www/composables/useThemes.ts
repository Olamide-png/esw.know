// www/composables/useThemes.ts
import { computed } from 'vue'
import type { Theme } from '@/lib/themes'
import { themes } from '@/lib/themes'

type Color = Theme['name']

interface Config {
  theme: Color
  radius: number
}

export function useThemes() {
  // ✅ auto-imported now thanks to imports.presets
  const colorMode = useColorMode()
  const isLight = computed(() => colorMode.value === 'light')

  const cfg = (globalThis as any).useConfig?.() as any | undefined
  const defaultThemeName: Color = cfg?.value?.theme?.name ?? 'teal'
  const defaultRadius = cfg?.value?.theme?.radius ?? 12

  const cookie = useCookie<Config>('theme', {
    default: () => ({ theme: defaultThemeName, radius: defaultRadius }),
  })

  const theme = computed<Color>(() => cookie.value.theme)
  const radius = computed<number>(() => cookie.value.radius)
  const themeClass = computed(() => `theme-${theme.value}`)

  function setTheme(themeName: Color) {
    if (themes.some(t => t.name === themeName)) cookie.value.theme = themeName
  }
  function setRadius(newRadius: number) {
    cookie.value.radius = newRadius
  }

  const themePrimary = computed(() => {
    const t = themes.find(t => t.name === theme.value)
    const hsl = t?.cssVars[isLight.value ? 'light' : 'dark'].primary
    return hsl ? `hsl(${hsl})` : 'hsl(0 0% 50%)'
  })

  return { themeClass, theme, setTheme, radius, setRadius, themePrimary, themes, isLight }
}


