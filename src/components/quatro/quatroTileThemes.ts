import type { Language } from '../../i18n'
import type { QuatroColor, QuatroTile } from '../../game/quatro/types'

export const quatroTileThemeIds = [
  'classicQuatro',
  'platinum',
  'neonArcade',
  'naturalWood',
] as const

export type QuatroTileTheme = typeof quatroTileThemeIds[number]

export interface QuatroTileThemePalette {
  frontTop: string
  frontBottom: string
  frontBorder: string
  frontText: string
  backTop: string
  backBottom: string
  backBorder: string
  backText: string
  backLabel: 'Quatro'
  colors: Record<QuatroColor, string>
}

export const defaultQuatroTileTheme: QuatroTileTheme = 'classicQuatro'

export const quatroTileThemePalettes: Record<
  QuatroTileTheme,
  QuatroTileThemePalette
> = {
  classicQuatro: {
    frontTop: '#fffdf7',
    frontBottom: '#d9dde4',
    frontBorder: '#111827',
    frontText: '#ffffff',
    backTop: '#1d2940',
    backBottom: '#080d18',
    backBorder: '#e5e4e2',
    backText: '#f8fafc',
    backLabel: 'Quatro',
    colors: {
      red: '#f04444',
      green: '#29a85b',
      yellow: '#e8bd19',
      blue: '#3297ed',
    },
  },
  platinum: {
    frontTop: '#ffffff',
    frontBottom: '#b7bcc4',
    frontBorder: '#626a75',
    frontText: '#ffffff',
    backTop: '#eef1f5',
    backBottom: '#858c96',
    backBorder: '#333b46',
    backText: '#17202b',
    backLabel: 'Quatro',
    colors: {
      red: '#c93646',
      green: '#16845a',
      yellow: '#c89b00',
      blue: '#276fba',
    },
  },
  neonArcade: {
    frontTop: '#202338',
    frontBottom: '#090b18',
    frontBorder: '#35f2ff',
    frontText: '#ffffff',
    backTop: '#6826a8',
    backBottom: '#12051f',
    backBorder: '#ff58d6',
    backText: '#8ffcff',
    backLabel: 'Quatro',
    colors: {
      red: '#ff3f72',
      green: '#31e88a',
      yellow: '#ffe34f',
      blue: '#39a8ff',
    },
  },
  naturalWood: {
    frontTop: '#f3d5a0',
    frontBottom: '#b8793d',
    frontBorder: '#6f3e1f',
    frontText: '#fff8e8',
    backTop: '#704225',
    backBottom: '#2d160c',
    backBorder: '#e2b978',
    backText: '#fff1cf',
    backLabel: 'Quatro',
    colors: {
      red: '#bd3f35',
      green: '#3f7f46',
      yellow: '#d6a827',
      blue: '#3f6f9f',
    },
  },
}

export function normalizeQuatroTileTheme(
  value: unknown,
): QuatroTileTheme {
  return quatroTileThemeIds.includes(value as QuatroTileTheme)
    ? value as QuatroTileTheme
    : defaultQuatroTileTheme
}

export function quatroActionGlyph(
  action: QuatroTile['action'],
): string {
  if (action === 'swap') return '⇄'
  if (action === 'push') return '⇩'
  if (action === 'minus2') return '−2'
  return ''
}

export function quatroTileThemeTitle(language: Language): string {
  if (language === 'zh') return '牌块主题'
  if (language === 'de') return 'Spielstein-Design'
  return 'Tile theme'
}

export function quatroTileThemeName(
  language: Language,
  theme: QuatroTileTheme,
): string {
  const names: Record<Language, Record<QuatroTileTheme, string>> = {
    en: {
      classicQuatro: 'Classic Quatro',
      platinum: 'Platinum',
      neonArcade: 'Neon Arcade',
      naturalWood: 'Natural Wood',
    },
    zh: {
      classicQuatro: '经典四连',
      platinum: '铂金',
      neonArcade: '霓虹街机',
      naturalWood: '天然木纹',
    },
    de: {
      classicQuatro: 'Klassisches Quatro',
      platinum: 'Platin',
      neonArcade: 'Neon-Arcade',
      naturalWood: 'Naturholz',
    },
  }
  return names[language][theme]
}

export function quatroTileThemeDescription(
  language: Language,
  theme: QuatroTileTheme,
): string {
  const descriptions: Record<
    Language,
    Record<QuatroTileTheme, string>
  > = {
    en: {
      classicQuatro: 'Ivory fronts with midnight-blue Quatro backs.',
      platinum: 'Brushed-silver fronts with charcoal Quatro backs.',
      neonArcade: 'Dark neon fronts with violet arcade backs.',
      naturalWood: 'Maple fronts with walnut Quatro backs.',
    },
    zh: {
      classicQuatro: '象牙色正面，午夜蓝 Quatro 背面。',
      platinum: '拉丝银正面，炭灰色 Quatro 背面。',
      neonArcade: '深色霓虹正面，紫色街机风背面。',
      naturalWood: '枫木色正面，胡桃木 Quatro 背面。',
    },
    de: {
      classicQuatro: 'Elfenbeinfronten mit mitternachtsblauen Quatro-Rückseiten.',
      platinum: 'Gebürstete Silberfronten mit anthrazitfarbenen Quatro-Rückseiten.',
      neonArcade: 'Dunkle Neonfronten mit violetten Arcade-Rückseiten.',
      naturalWood: 'Ahornfronten mit Quatro-Rückseiten aus Walnussholz.',
    },
  }
  return descriptions[language][theme]
}
