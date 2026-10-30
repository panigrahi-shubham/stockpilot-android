import { useColorScheme } from 'react-native';
import { useApp } from '@/state/AppContext';

export const palette = {
  light: {
    bg: '#F4F6F5',
    card: '#FFFFFF',
    cardAlt: '#F8FAF9',
    text: '#13201C',
    textMuted: '#5D6C67',
    textFaint: '#8C9A95',
    border: '#E1E7E4',
    primary: '#0E5E4F',
    primaryDark: '#0A4A3E',
    primarySoft: '#E2F1EC',
    onPrimary: '#FFFFFF',
    accent: '#F5A524',
    accentSoft: '#FDF1DC',
    danger: '#D14343',
    dangerSoft: '#FCE9E9',
    success: '#1E9461',
    successSoft: '#E1F5EA',
    warning: '#C98510',
    warningSoft: '#FFF4DE',
    info: '#2E6BD8',
    infoSoft: '#E6EEFC',
    overlay: 'rgba(10, 20, 17, 0.55)',
    skeleton: '#E7ECEA',
  },
  dark: {
    bg: '#0C1311',
    card: '#151F1C',
    cardAlt: '#1A2622',
    text: '#E7EFEC',
    textMuted: '#9AABA5',
    textFaint: '#6E7F79',
    border: '#24322E',
    primary: '#3BBB97',
    primaryDark: '#2E9C7D',
    primarySoft: '#12332B',
    onPrimary: '#06201A',
    accent: '#F5B547',
    accentSoft: '#3A2D14',
    danger: '#F06A6A',
    dangerSoft: '#3A1A1A',
    success: '#4CCB8E',
    successSoft: '#12301F',
    warning: '#F0B13C',
    warningSoft: '#352A12',
    info: '#6D9BF0',
    infoSoft: '#16253F',
    overlay: 'rgba(0, 0, 0, 0.65)',
    skeleton: '#1F2B27',
  },
};

export type Colors = typeof palette.light;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const font = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 12, fontWeight: '500' as const },
  tiny: { fontSize: 10.5, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export function useTheme() {
  const system = useColorScheme();
  const { state } = useApp();
  const mode = state.settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : state.settings.theme;
  return { c: mode === 'dark' ? palette.dark : palette.light, mode } as const;
}
