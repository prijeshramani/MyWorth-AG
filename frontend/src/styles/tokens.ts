export const tokens = {
  colors: {
    bg: {
      primary: '#0B0B0C',
      secondary: '#15161A',
      tertiary: '#1E2025',
      glass: 'rgba(21, 22, 26, 0.75)',
      card: '#1E2025',
      cardHover: '#252830',
    },
    border: {
      default: '#2B2E35',
      subtle: 'rgba(255, 255, 255, 0.08)',
      accent: '#4F7FFF',
    },
    accent: {
      primary: '#4F7FFF',
      primaryHover: '#3B6EEF',
      primaryMuted: 'rgba(79, 127, 255, 0.15)',
      primaryGlow: 'rgba(79, 127, 255, 0.25)',
      secondary: '#8B5CF6',
    },
    status: {
      success: '#32D583',
      successMuted: 'rgba(50, 213, 131, 0.15)',
      warning: '#F79009',
      warningMuted: 'rgba(247, 144, 9, 0.15)',
      danger: '#F04438',
      dangerMuted: 'rgba(240, 68, 56, 0.15)',
      info: '#38BDF8',
      infoMuted: 'rgba(56, 189, 248, 0.15)',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#9CA3AF',
      muted: '#6B7280',
      inverse: '#0B0B0C',
      accent: '#4F7FFF',
    },
  },
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'Geist Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    subtle: '0 2px 8px rgba(0, 0, 0, 0.4)',
    glow: '0 0 20px rgba(79, 127, 255, 0.2)',
    card: '0 4px 20px rgba(0, 0, 0, 0.5)',
    dropdown: '0 10px 30px rgba(0, 0, 0, 0.7)',
  },
  motion: {
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    transitionFast: 'all 0.15s ease',
    transitionSlow: 'all 0.3s ease-out',
  },
} as const;

export type DesignTokens = typeof tokens;
