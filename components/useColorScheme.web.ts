import { useSettingsStore } from '@/store/useSettingsStore';

export function useColorScheme() {
  const mode = useSettingsStore((s) => s.themeMode);
  if (mode === 'light' || mode === 'dark') return mode;
  return 'light';
}
