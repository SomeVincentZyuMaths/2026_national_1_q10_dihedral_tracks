import type { ThemeName } from './types';

export interface ThemeColors {
  ink: string;
  muted: string;
  blue: string;
  red: string;
  teal: string;
  gold: string;
  surface: string;
  grid: string;
}

export function getThemeColors(): ThemeColors {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    ink: read('--ink', '#142033'),
    muted: read('--muted', '#687386'),
    blue: read('--blue', '#1f4b99'),
    red: read('--red', '#d14a35'),
    teal: read('--teal', '#157c82'),
    gold: read('--gold', '#c68b22'),
    surface: read('--surface', '#fffdf7'),
    grid: read('--grid', '#aeb8c9'),
  };
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#080d15' : '#f4f0e6';
}
