export const typography = {
  fontFamilies: {
    heading: 'Poppins, sans-serif',
    body: 'Inter, Roboto, sans-serif'
  },
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    xxl: '1.5rem',     // 24px
    xxxl: '2rem'       // 32px
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeights: {
    none: '1',
    tight: '1.3',
    snug: '1.4',
    normal: '1.5',
    relaxed: '1.6'
  }
} as const;
