import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import ColorDotPicker from '@/components/ColorDotPicker';
import EmojiPicker from '@/components/EmojiPicker';
import GlassCard from '@/components/GlassCard';
import { cancelHabitReminders, scheduleHabitReminder } from '@/lib/notifications';
import { useHabitStore } from '@/store/useHabitStore';
import type { Frequency } from '@/store/useHabitStore';

const WEEK_ORDER = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

type FreqKind = 'daily' | 'weekdays' | 'xPerWeek';

export default function CreateHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const editing = id ? habits.find((h) => h.id === id) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '');
  const [color, setColor] = useState(editing?.color ?? '#111111');
  const [freqKind, setFreqKind] = useState<FreqKind>(editing?.frequency.kind ?? 'daily');
  const [days, setDays] = useState<number[]>(editing?.frequency.kind === 'weekdays' ? editing.frequency.days : [1, 2, 3, 4, 5]);
  const [target, setTarget] = useState(editing?.frequency.kind === 'xPerWeek' ? editing.frequency.target : 3);
  const [timesPerDay, setTimesPerDay] = useState(editing?.timesPerDay ?? 1);
  const [reminder, setReminder] = useState(editing?.reminderTime ?? '');
  const [error, setError] = useState('');

  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';
  const inputBorder = 'rgba(128,128,128,0.35)';

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const buildFrequency = (): Frequency | null => {
    if (freqKind === 'daily') return { kind: 'daily' };
    if (freqKind === 'weekdays') {
      if (days.length === 0) return null;
      return { kind: 'weekdays', days: [...days].sort() };
    }
    if (target < 1 || target > 7) return null;
    return { kind: 'xPerWeek', target };
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your habit a name.');
      return;
    }
    const frequency = buildFrequency();
    if (!frequency) {
      setError(freqKind === 'weekdays' ? 'Pick at least one weekday.' : 'Weekly target must be 1–7.');
      return;
    }
    if (!/^#([0-9a-fA-F]{6})$/.test(color)) {
      setError('Pick a valid color.');
      return;
    }
    const cleanReminder = reminder.trim();
    if (cleanReminder && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(cleanReminder)) {
      setError('Reminder must be HH:mm, e.g. 08:00.');
      return;
    }
    setError('');
    const payload = {
      name: trimmed,
      emoji: emoji || undefined,
      color,
      frequency,
      timesPerDay: Math.max(1, Math.floor(timesPerDay)),
      reminderTime: cleanReminder || undefined,
    };
    if (editing) {
      updateHabit(editing.id, payload);
      const updated = { ...editing, ...payload };
      if (cleanReminder) {
        const ok = await scheduleHabitReminder(updated);
        if (!ok) {
          setError('Reminder saved, but notifications permission was denied.');
          return;
        }
      } else {
        await cancelHabitReminders(editing.id);
      }
      router.back();
    } else {
      const habit = addHabit(payload);
      if (cleanReminder) {
        const ok = await scheduleHabitReminder(habit);
        if (!ok) {
          setError('Habit created, but notifications permission was denied.');
          return;
        }
      }
      router.replace(`/habit/${habit.id}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: editing ? 'Edit habit' : 'New habit' }} />
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 10 pages"
          placeholderTextColor={sub}
          style={[styles.input, { color: ink, borderColor: inputBorder }]}
        />
      </GlassCard>
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Emoji</Text>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </GlassCard>
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Color</Text>
        <ColorDotPicker value={color} onChange={setColor} />
      </GlassCard>
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Frequency</Text>
        <View style={styles.segRow}>
          {(['daily', 'weekdays', 'xPerWeek'] as FreqKind[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setFreqKind(k)}
              style={[styles.segBtn, freqKind === k && styles.segActive]}
            >
              <Text style={[styles.segText, freqKind === k && styles.segTextActive]}>
                {k === 'daily' ? 'Daily' : k === 'weekdays' ? 'Weekdays' : 'X / week'}
              </Text>
            </Pressable>
          ))}
        </View>
        {freqKind === 'weekdays' ? (
          <View style={styles.dayRow}>
            {WEEK_ORDER.map((d) => {
              const active = days.includes(d.value);
              return (
                <Pressable
                  key={d.value}
                  onPress={() => toggleDay(d.value)}
                  style={[styles.dayBtn, active && styles.segActive]}
                >
                  <Text style={[styles.dayText, active && styles.segTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {freqKind === 'xPerWeek' ? (
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setTarget((t) => Math.max(1, t - 1))}>
              <Minus size={16} color={ink} />
            </Pressable>
            <Text style={[styles.stepValue, { color: ink }]}>{target} / week</Text>
            <Pressable style={styles.stepBtn} onPress={() => setTarget((t) => Math.min(7, t + 1))}>
              <Plus size={16} color={ink} />
            </Pressable>
          </View>
        ) : null}
      </GlassCard>
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Times per day</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setTimesPerDay((t) => Math.max(1, t - 1))}>
            <Minus size={16} color={ink} />
          </Pressable>
          <Text style={[styles.stepValue, { color: ink }]}>{timesPerDay}x</Text>
          <Pressable style={styles.stepBtn} onPress={() => setTimesPerDay((t) => Math.min(99, t + 1))}>
            <Plus size={16} color={ink} />
          </Pressable>
        </View>
      </GlassCard>
      <GlassCard>
        <Text style={[styles.label, { color: ink }]}>Reminder (optional)</Text>
        <TextInput
          value={reminder}
          onChangeText={setReminder}
          placeholder="HH:mm, e.g. 08:00"
          placeholderTextColor={sub}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={[styles.input, { color: ink, borderColor: inputBorder }]}
        />
      </GlassCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>{editing ? 'Save changes' : 'Create habit'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)', paddingVertical: 10, alignItems: 'center' },
  segActive: { backgroundColor: '#111', borderColor: '#111' },
  segText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  segTextActive: { color: '#fff' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  dayBtn: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)', paddingVertical: 8, paddingHorizontal: 12 },
  dayText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  error: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
  saveBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
