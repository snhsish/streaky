import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import ContributionGrid from '@/components/ContributionGrid';
import GlassCard from '@/components/GlassCard';
import HabitCard from '@/components/HabitCard';
import { toDayKey } from '@/lib/dates';
import { cancelHabitReminders, scheduleHabitReminder } from '@/lib/notifications';
import { getStreak, isComplete } from '@/lib/streak';
import { useHabitStore } from '@/store/useHabitStore';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function frequencyLabel(frequency: { kind: string; days?: number[]; target?: number }): string {
  if (frequency.kind === 'daily') return 'Daily';
  if (frequency.kind === 'weekdays' && frequency.days) {
    const names = [...frequency.days].sort().map((d) => DAY_LABELS[d]);
    return names.join(' · ');
  }
  if (frequency.kind === 'xPerWeek' && frequency.target) return `${frequency.target}x / week`;
  return '';
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const logs = useHabitStore((s) => s.logs);
  const toggleDay = useHabitStore((s) => s.toggleDay);
  const increment = useHabitStore((s) => s.increment);
  const decrement = useHabitStore((s) => s.decrement);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDayKey(today);
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={[styles.title, { color: ink }]}>Habit not found</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const habitLogs = logs[habit.id] ?? {};
  const streak = getStreak(habit, logs, today);
  const total = Object.values(habitLogs).filter((c) => isComplete(habit, c)).length;

  const confirmDelete = () => {
    Alert.alert('Delete habit?', `"${habit.name}" and its history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void cancelHabitReminders(habit.id);
          removeHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: habit.name }} />
      <View style={styles.header}>
        {habit.emoji ? <Text style={styles.emoji}>{habit.emoji}</Text> : null}
        <View style={styles.headerMeta}>
          <Text style={[styles.title, { color: ink }]}>{habit.name}</Text>
          <Text style={[styles.freq, { color: sub }]}>{frequencyLabel(habit.frequency as { kind: string })}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: ink }]}>{streak.current}</Text>
          <Text style={[styles.statLabel, { color: sub }]}>Current</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: ink }]}>{streak.best}</Text>
          <Text style={[styles.statLabel, { color: sub }]}>Best</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: ink }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: sub }]}>Total</Text>
        </View>
      </View>
      <GlassCard>
        <HabitCard
          habit={habit}
          count={habitLogs[todayKey] ?? 0}
          streak={streak.current}
          onToggle={() => toggleDay(habit.id, todayKey)}
          onIncrement={() => increment(habit.id, todayKey)}
          onDecrement={() => decrement(habit.id, todayKey)}
        />
      </GlassCard>
      <View style={styles.gridWrap}>
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: ink }]}>Last 20 weeks</Text>
          <Text style={[styles.sectionSub, { color: sub }]}>Tap a day to toggle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
            <ContributionGrid habit={habit} habitLogs={habitLogs} weeks={20} onToggleDay={(dayKey) => toggleDay(habit.id, dayKey)} />
          </ScrollView>
        </GlassCard>
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => router.push(`/create?id=${habit.id}`)}>
          <Text style={[styles.secondaryBtnText, { color: ink }]}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={() => {
            const next = !habit.archived;
            archiveHabit(habit.id, next);
            if (next) void cancelHabitReminders(habit.id);
            else void scheduleHabitReminder(habit);
          }}
        >
          <Text style={[styles.secondaryBtnText, { color: ink }]}>{habit.archived ? 'Unarchive' : 'Archive'}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.dangerBtn]} onPress={confirmDelete}>
          <Text style={styles.dangerBtnText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  headerMeta: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  freq: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  gridWrap: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  gridScroll: {
    paddingBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.35)',
  },
  secondaryBtnText: {
    fontWeight: '600',
  },
  dangerBtn: {
    backgroundColor: '#dc2626',
  },
  dangerBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
