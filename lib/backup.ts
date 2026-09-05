import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { toDayKey } from './dates';
import type { Habit, Logs } from '../store/useHabitStore';

export interface BackupPayload {
  app: 'streaky';
  version: 1;
  exportedAt: string;
  habits: Habit[];
  logs: Logs;
}

export function buildBackup(habits: Habit[], logs: Logs): BackupPayload {
  return {
    app: 'streaky',
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    logs,
  };
}

export function parseBackup(raw: string): BackupPayload {
  const data = JSON.parse(raw) as Partial<BackupPayload>;
  if (data.app !== 'streaky' || !Array.isArray(data.habits) || typeof data.logs !== 'object' || !data.logs) {
    throw new Error('Not a Streaky backup file.');
  }
  for (const h of data.habits) {
    if (!h || typeof h.id !== 'string' || typeof h.name !== 'string' || typeof h.color !== 'string') {
      throw new Error('Backup contains an invalid habit.');
    }
  }
  return {
    app: 'streaky',
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    habits: data.habits as Habit[],
    logs: data.logs as Logs,
  };
}

export async function exportBackupFile(habits: Habit[], logs: Logs): Promise<string> {
  const payload = buildBackup(habits, logs);
  const json = JSON.stringify(payload, null, 2);
  const name = `streaky-backup-${toDayKey()}.json`;
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.write(json);
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Streaky backup',
  });
  return file.uri;
}

export async function importBackupFile(): Promise<BackupPayload> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) throw new Error('cancelled');
  const uri = result.assets[0]?.uri;
  if (!uri) throw new Error('No file selected.');
  const file = new File(uri);
  const text = await file.text();
  return parseBackup(text);
}
