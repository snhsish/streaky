import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from '@/components/GlassCard';
import { useColorScheme } from '@/components/useColorScheme';
import { exportBackupFile, importBackupFile } from '@/lib/backup';
import { cancelHabitReminders, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore } from '@/store/useHabitStore';
import { useSettingsStore, type ThemeMode } from '@/store/useSettingsStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';
  const bg = dark ? '#000' : '#fff';

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const restore = useHabitStore((s) => s.restore);
  const clearAll = useHabitStore((s) => s.clearAll);

  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const habitCount = habits.filter((h) => !h.archived).length;
  const completionCount = Object.values(logs).reduce((n, days) => n + Object.keys(days).length, 0);

  const onExport = async () => {
    if (busy) return;
    setBusy('export');
    try {
      await exportBackupFile(habits, logs);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Export failed.';
      if (message !== 'Sharing is not available on this device.') Alert.alert('Export failed', message);
      else Alert.alert('Not available', message);
    } finally {
      setBusy(null);
    }
  };

  const onImport = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const backup = await importBackupFile();
      Alert.alert(
        'Import backup?',
        `Replace current data with ${backup.habits.length} habits from ${new Date(backup.exportedAt).toLocaleDateString()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              for (const h of habits) void cancelHabitReminders(h.id);
              restore(backup.habits, backup.logs);
              for (const h of backup.habits) {
                if (h.reminderTime && !h.archived) void scheduleHabitReminder(h);
              }
            },
          },
        ],
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Import failed.';
      if (message !== 'cancelled') Alert.alert('Import failed', message);
    } finally {
      setBusy(null);
    }
  };

  const onClear = () => {
    Alert.alert('Clear all data?', 'All habits and history on this device will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          for (const h of habits) void cancelHabitReminders(h.id);
          clearAll();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: ink }]}>Settings</Text>
      <Text style={[styles.sub, { color: sub }]}>
        {habitCount} habits · {completionCount} logged days
      </Text>

      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Appearance</Text>
        <Text style={[styles.hint, { color: sub }]}>Black / white minimal theme</Text>
        <View style={styles.segRow}>
          {THEME_OPTIONS.map((o) => {
            const active = themeMode === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityLabel={`Theme ${o.label}`}
                onPress={() => setThemeMode(o.value)}
                style={[styles.segBtn, active && { backgroundColor: dark ? '#fff' : '#111', borderColor: dark ? '#fff' : '#111' }]}
              >
                <Text style={[styles.segText, active && { color: dark ? '#111' : '#fff' }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Backup</Text>
        <Text style={[styles.hint, { color: sub }]}>JSON file · Google Drive sync hooks in later</Text>
        <View style={styles.btnCol}>
          <Pressable style={[styles.primaryBtn, busy && styles.btnDisabled]} onPress={onExport} disabled={!!busy}>
            <Text style={styles.primaryText}>{busy === 'export' ? 'Exporting…' : 'Export JSON'}</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={onImport}
            disabled={!!busy}
          >
            <Text style={[styles.secondaryText, { color: ink }]}>{busy === 'import' ? 'Importing…' : 'Import JSON'}</Text>
          </Pressable>
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Data</Text>
        <Pressable style={styles.dangerBtn} onPress={onClear}>
          <Text style={styles.dangerText}>Clear all data</Text>
        </Pressable>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>About</Text>
        <Text style={[styles.hint, { color: sub }]}>Streaky 1.0.0 · local-first · no account needed</Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 64, paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 2, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 13, marginBottom: 12 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)', paddingVertical: 10, alignItems: 'center' },
  segText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  btnCol: { gap: 10 },
  primaryBtn: { backgroundColor: '#111', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)' },
  secondaryText: { fontWeight: '600', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  dangerBtn: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
