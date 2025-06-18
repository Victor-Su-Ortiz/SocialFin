export const theme = {
  colors: {
    primary: '#00ff88',
    secondary: '#00ccff',
    accent: '#ff00ff',
    background: '#0a0a0a',
    surface: '#111',
    border: '#222',
    text: {
      primary: '#ffffff',
      secondary: '#ccc',
      tertiary: '#666',
    },
    error: '#ff4444',
    success: '#00ff88',
    warning: '#feca57',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 30,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
  },
};
