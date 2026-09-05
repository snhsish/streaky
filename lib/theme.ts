import { useColorScheme as useSystemScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

export type AppScheme = 'light' | 'dark';

export function useAppColorScheme(): AppScheme {
  const system = useSystemScheme();
  const mode = useSettingsStore((s) => s.themeMode);
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

export function themeColors(scheme: AppScheme) {
  const dark = scheme === 'dark';
  return {
    dark,
    ink: dark ? '#fff' : '#111',
    sub: dark ? '#a1a1aa' : '#6b7280',
    bg: dark ? '#000' : '#fff',
    bgSoft: dark ? '#0a0a0a' : '#f8f8f8',
    border: 'rgba(128,128,128,0.28)',
    emptyCell: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
  };
}
