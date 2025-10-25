// www/lib/themes.ts
export type Theme = {
  /** machine name used in classes and lookup */
  name: 'teal' | 'violet' | 'rose' | 'slate';
  /** optional human label for UI */
  label: string;
  /** CSS vars (HSL triplets) for light/dark */
  cssVars: {
    light: { primary: string };
    dark: { primary: string };
  };
  /** default radius for this theme (if you want it) */
  radius?: number;
};

export const themes: Theme[] = [
  {
    name: 'teal',
    label: 'Teal',
    cssVars: {
      light: { primary: '173 80% 40%' }, // hsl(173 80% 40%)
      dark:  { primary: '173 70% 45%' },
    },
    radius: 12,
  },
  {
    name: 'violet',
    label: 'Violet',
    cssVars: {
      light: { primary: '262 83% 58%' },
      dark:  { primary: '262 76% 60%' },
    },
    radius: 12,
  },
  {
    name: 'rose',
    label: 'Rose',
    cssVars: {
      light: { primary: '346 77% 49%' },
      dark:  { primary: '346 72% 55%' },
    },
    radius: 12,
  },
  {
    name: 'slate',
    label: 'Slate',
    cssVars: {
      light: { primary: '215 20% 50%' },
      dark:  { primary: '215 16% 60%' },
    },
    radius: 12,
  },
];
