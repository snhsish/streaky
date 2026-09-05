import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV, type MMKV } from 'react-native-mmkv';

let mmkv: MMKV | null = null;
try {
  mmkv = createMMKV({ id: 'streaky' });
} catch {
  mmkv = null;
}

export const storage = mmkv;

async function getItem(key: string): Promise<string | null> {
  try {
    if (mmkv) return mmkv.getString(key) ?? null;
  } catch {
    // fall through to AsyncStorage
  }
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (mmkv) {
      mmkv.set(key, value);
      return;
    }
  } catch {
    // fall through to AsyncStorage
  }
  await AsyncStorage.setItem(key, value);
}

async function removeItem(key: string): Promise<void> {
  try {
    if (mmkv) mmkv.remove(key);
  } catch {
    // ignore, still clear fallback
  }
  await AsyncStorage.removeItem(key);
}

export const zustandStorage = { getItem, setItem, removeItem };
