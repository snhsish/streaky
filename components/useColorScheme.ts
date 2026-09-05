import { useColorScheme as useColorSchemeCore } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export const useColorScheme = () => {
  const coreScheme = useColorSchemeCore();
  const system: 'light' | 'dark' = coreScheme === 'dark' ? 'dark' : 'light';
  const mode = useSettingsStore((s) => s.themeMode);
  if (mode === 'light' || mode === 'dark') return mode;
  return system;
};
