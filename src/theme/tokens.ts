export const palette = {
  background: '#f6efe6',
  backgroundAlt: '#efe2d0',
  surface: '#fffaf4',
  surfaceStrong: '#ffffff',
  border: '#ead8c3',
  ink: '#23303a',
  inkSoft: '#63707c',
  white: '#ffffff',
  garden: '#2f7f6d',
  mint: '#9ccfc0',
  terracotta: '#d86f45',
  coral: '#cc5c4e',
  amber: '#e9a23b',
  gold: '#d8b262',
  sky: '#79b9d1',
  berry: '#a75d7b',
  night: '#27384e',
  slate: '#445770',
  success: '#2f7f6d',
  warning: '#e59a2f',
  danger: '#cb4e5d',
};

export const screenPadding = 18;

export const cardShadow = {
  shadowColor: '#2d2118',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 5,
};

export const statusThemes = {
  overdue: {
    color: palette.danger,
    surface: '#fff0ee',
    accent: palette.coral,
    label: 'Urgent',
  },
  today: {
    color: palette.warning,
    surface: '#fff5e6',
    accent: palette.amber,
    label: 'Aujourd hui',
  },
  soon: {
    color: palette.gold,
    surface: '#fbf3df',
    accent: palette.gold,
    label: 'Bientot',
  },
  ok: {
    color: palette.success,
    surface: '#eef8f4',
    accent: palette.garden,
    label: 'Stable',
  },
} as const;

export const difficultyThemes = {
  Facile: {
    color: palette.garden,
    surface: '#edf8f4',
    accent: palette.mint,
  },
  Moyen: {
    color: palette.amber,
    surface: '#fff5e7',
    accent: '#f2cf93',
  },
  Difficile: {
    color: palette.coral,
    surface: '#fff0ed',
    accent: '#f1b4a7',
  },
} as const;

export const headerThemes = {
  garden: {
    background: palette.garden,
    subtitle: '#d4f0e7',
    orbA: palette.amber,
    orbB: palette.sky,
    glow: '#4f9d89',
  },
  night: {
    background: palette.night,
    subtitle: '#d5e2f5',
    orbA: palette.terracotta,
    orbB: palette.sky,
    glow: palette.slate,
  },
  atlas: {
    background: '#385b79',
    subtitle: '#dbe9f7',
    orbA: palette.gold,
    orbB: palette.terracotta,
    glow: '#5e84a7',
  },
} as const;

export type HeaderThemeName = keyof typeof headerThemes;
