// SuiVerify Brand Colors - Updated to match landing page theme
export const brandColors = {
    // Primary - Deep Amethyst
    primary: '#7C3AED',
    primaryDark: '#5B21B6',
    primaryLight: '#BC9AF5',
    primaryBg: '#F2EBFE',
    
    // Secondary - Brand Teal
    secondary: '#14B8A6',
    secondaryDark: '#0D9488',
    secondaryLight: '#5EEAD4',
    
    // Dark Navy (keeping for compatibility)
    darkNavy: '#1E293B',
    
    // Light Blue (keeping for compatibility)
    lightBlue: '#94A3B8',
    
    // Darker Navy (keeping for compatibility)
    darkerNavy: '#0F172A',
    
    // White
    white: '#ffffff',
    
    // Neutral Colors
    ghostWhite: '#F8F9FA',
    charcoalText: '#212529',
    lightGray: '#DEE2E6',
    
    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  } as const;
  
  // Color variations for different use cases
  export const brandColorVariations = {
    primary: {
      DEFAULT: brandColors.primary,
      50: '#f0f8ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: brandColors.primary, // #4DA2FF
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    darkNavy: {
      DEFAULT: brandColors.darkNavy,
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: brandColors.darkNavy, // #011829
    },
    lightBlue: {
      DEFAULT: brandColors.lightBlue,
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: brandColors.lightBlue, // #c0e6ff
    },
    darkerNavy: {
      DEFAULT: brandColors.darkerNavy,
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: brandColors.darkerNavy, // #030f1c
    },
  } as const;
  
  // Semantic color mappings
  export const semanticColors = {
    background: {
      primary: brandColors.darkerNavy,
      secondary: brandColors.darkNavy,
      light: brandColors.lightBlue,
    },
    text: {
      primary: brandColors.white,
      secondary: brandColors.lightBlue,
      muted: '#94a3b8',
    },
    accent: {
      primary: brandColors.primary,
      secondary: brandColors.lightBlue,
    },
    border: {
      primary: brandColors.primary,
      secondary: brandColors.lightBlue,
      muted: '#334155',
    },
  } as const;
  
  // Gradient definitions - Updated to match landing page
  export const gradients = {
    primary: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
    accent: `linear-gradient(135deg, ${brandColors.warning} 0%, ${brandColors.primary} 100%)`,
    dark: `linear-gradient(135deg, ${brandColors.darkerNavy} 0%, ${brandColors.darkNavy} 100%)`,
    hero: `linear-gradient(135deg, ${brandColors.darkerNavy} 0%, ${brandColors.darkNavy} 50%, ${brandColors.darkNavy} 100%)`,
    card: `linear-gradient(135deg, ${brandColors.darkNavy} 0%, ${brandColors.darkNavy} 100%)`,
  } as const;
  
  // Export all colors for easy access
  export const colors = {
    ...brandColors,
    variations: brandColorVariations,
    semantic: semanticColors,
    gradients,
  } as const;
  
  export default colors;
  