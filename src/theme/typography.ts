export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const fontConfig = {
  sizes: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};
