/** Tokens tomados de los mockups de Figma de ViaDeep. */
export const colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF4FF',
  surfaceBlue: '#E5EEFF',
  surfaceBlueStrong: '#DCE9FF',
  surfaceBlueSoft: '#D8E2FF',

  navy: '#0F2042',
  navyMid: '#12264C',
  navyLight: '#1A365D',
  primary: '#0057C0',
  primaryBright: '#006FF0',

  text: '#000922',
  textStrong: '#0B1C30',
  textSecondary: '#45464E',
  textMuted: '#75777F',
  placeholder: 'rgba(117,119,127,0.7)',

  border: '#C5C6CF',
  borderSoft: 'rgba(197,198,207,0.6)',
  borderFaint: 'rgba(197,198,207,0.4)',

  success: '#009C6B',
  successBright: '#4EDEA3',
  successSoft: '#6FFBBE',
  successSurface: '#E6F8F1',

  warning: '#F59E0B',
  warningSurface: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  danger: '#BA1A1A',
  dangerSurface: '#FFDAD6',

  white: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { xs: 2, sm: 4, md: 8, lg: 12 } as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#0057C0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const;
