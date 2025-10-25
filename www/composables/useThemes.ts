// www/composables/useThemes.ts
import { computed } from 'vue'
import { useCookie } from '#imports'
import { useColorMode } from '#color-mode'
import type { Theme } from '@/lib/themes'
import { themes } from '@/lib/themes'

type Color = Theme['name']

interface Config {
  theme: Color
  radius: number
}

export function useThemes() {
  const { value: color } = useColorMode()            // ref<string>
  const isLight = computed(() => color.value === 'light')

  // Try to read defaults from your app config (if you have one)
  // Fallback to 'teal' + radius 12 if not present.
  const cfg = useConfig?.() as any | undefined       // optional, if you have a custom useConfig()
  const defaultThemeName: Color = cfg?.value?.theme?.name ?? 'teal'
  const defaultRadius: number = cfg?.value?.theme?.radius ?? 12

  const cookie = useCookie<Config>('theme', {
    default: () => ({
      theme: defaultThemeName,
      radius: defaultRadius,
    }),
    // optional: sameSite: 'lax', path: '/',
  })

  const theme = computed<Color>(() => cookie.value.theme)
  const radius = computed<number>(() => cookie.value.radius)

  const themeClass = computed(() => `theme-${theme.value}`)

  function setTheme(themeName: Color) {
    // validate incoming name against list to avoid invalid state
    if (themes.some(t => t.name === themeName)) {
      cookie.value.theme = themeName
    }
  }

  function setRadius(newRadius: number) {
    cookie.value.radius = newRadius
  }

  const themePrimary = computed(() => {
    const t = themes.find(t => t.name === theme.value)
    const hsl = t?.cssVars[isLight.value ? 'light' : 'dark'].primary
    return hsl ? `hsl(${hsl})` : 'hsl(0 0% 50%)'
  })

  return {
    // state
    theme,
    radius,
    themeClass,
    themePrimary,

    // actions
    setTheme,
    setRadius,

    // extras
    themes,
    isLight,
  }
}

