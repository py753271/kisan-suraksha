import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadow } from './shadow';
import { radius } from './radius';

export const tokens = {
  colors,
  typography,
  spacing,
  shadow,
  radius,
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1440px',
    ultrawide: '1920px'
  },
  transitions: {
    fast: 'all 0.15s ease-in-out',
    normal: 'all 0.3s ease-in-out',
    slow: 'all 0.5s ease-in-out'
  }
} as const;

export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof colors;
