const rolePalette = {
  admin: {
    primary: '#1E40AF',
    light: '#3B82F6',
    tint: '#EFF6FF',
    dark: '#1E3A8A',
  },
  driver: {
    primary: '#059669',
    light: '#10B981',
    tint: '#ECFDF5',
    dark: '#047857',
  },
  student: {
    primary: '#7C3AED',
    light: '#8B5CF6',
    tint: '#F5F3FF',
    dark: '#6D28D9',
  },
  amber: '#F59E0B',
  red: '#EF4444',
};

export const lightColors = {
  ...rolePalette,
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  overlay: 'rgba(15,23,42,0.45)',
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    white: '#FFFFFF',
    link: '#2563EB',
  },
  status: {
    success: { bg: '#DCFCE7', text: '#166534', icon: '#16A34A' },
    error: { bg: '#FEE2E2', text: '#991B1B', icon: '#EF4444' },
    warning: { bg: '#FEF3C7', text: '#92400E', icon: '#F59E0B' },
    info: { bg: '#DBEAFE', text: '#1E3A8A', icon: '#3B82F6' },
    default: { bg: '#F1F5F9', text: '#475569', icon: '#94A3B8' },
  },
};

export const darkColors = {
  ...rolePalette,
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  divider: '#1E293B',
  overlay: 'rgba(0,0,0,0.65)',
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#475569',
    white: '#FFFFFF',
    link: '#60A5FA',
  },
  status: {
    success: { bg: '#14532D', text: '#86EFAC', icon: '#4ADE80' },
    error: { bg: '#450A0A', text: '#FCA5A5', icon: '#F87171' },
    warning: { bg: '#451A03', text: '#FCD34D', icon: '#FBBF24' },
    info: { bg: '#1E3A8A', text: '#BFDBFE', icon: '#60A5FA' },
    default: { bg: '#1E293B', text: '#94A3B8', icon: '#475569' },
  },
};

export type ColorTokens = typeof lightColors;
export const colorSchemes = { light: lightColors, dark: darkColors };
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '400' as const },
  bodySm: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 },
} as const;

export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 16,
  },
} as const;
