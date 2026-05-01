export const colors = {
  primary: '#1A73E8',       // Main blue
  primaryLight: '#E8F0FE',  // Light blue background
  primaryDark: '#1557B0',   // Dark blue
  secondary: '#00BCD4',     // Cyan accent
  white: '#FFFFFF',
  background: '#F0F6FF',    // Very light blue background
  cardBg: '#FFFFFF',
  border: '#D0E4FF',
  text: '#1A1A2E',
  textSecondary: '#5F6B7A',
  textLight: '#9AA5B4',
  success: '#34A853',
  successLight: '#E6F4EA',
  danger: '#EA4335',
  dangerLight: '#FCE8E6',
  warning: '#FBBC04',
  warningLight: '#FEF7E0',
  emergency: '#D93025',
  emergencyLight: '#FCE8E6',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray400: '#9AA5B4',
  gray600: '#5F6B7A',
  shadow: 'rgba(26, 115, 232, 0.12)',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const shadow = {
  sm: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
