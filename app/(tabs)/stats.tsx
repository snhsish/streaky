import { useRouter } from 'expo-router';
import { addDays } from 'date-fns';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import GlassCard from '@/components/GlassCard';
import { toDayKey } from '@/lib/dates';
import { getStreak, isComplete, isDue } from '@/lib/streak';
import { useHabitStore } from '@/store/useHabitStore';

export default function StatsScreen() {
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const today = useMemo(() => new Date(), []);
  const todayKey = toDayKey(today);
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';

  const rows = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    return active
      .map((habit) => {
        const habitLogs = logs[habit.id] ?? {};
        const streak = getStreak(habit, logs, today);
        const total = Object.values(habitLogs).filter((c) => isComplete(habit, c)).length;
        const createdKey = toDayKey(new Date(habit.createdAt));
        let required = 0;
        let done = 0;
        for (let i = 0; i < 30; i += 1) {
          const date = addDays(today, -i);
          const key = toDayKey(date);
          if (key < createdKey) continue;
          if (!isDue(habit, date)) continue;
          required += 1;
          if (isComplete(habit, habitLogs[key] ?? 0)) done += 1;
        }
        return { habit, streak, total, rate: required === 0 ? 0 : done / required };
      })
      .sort((a, b) => b.streak.best - a.streak.best || b.total - a.total);
  }, [habits, logs, today]);

  const totals = useMemo(() => {
    const dueToday = rows.filter(({ habit }) => isDue(habit, today));
    const doneToday = dueToday.filter(({ habit }) => isComplete(habit, logs[habit.id]?.[todayKey] ?? 0)).length;
    return {
      habits: rows.length,
      doneToday,
      dueToday: dueToday.length,
      completions: rows.reduce((n, r) => n + r.total, 0),
      best: rows.reduce((n, r) => Math.max(n, r.streak.best), 0),
    };
  }, [rows, logs, today, todayKey]);

  if (rows.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
        <Text style={[styles.title, { color: ink }]}>Stats</Text>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: sub }]}>Create a habit to see totals and streaks.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: ink }]}>Stats</Text>
      <Text style={[styles.sub, { color: sub }]}>Last 30 days per habit</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.habit.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <GlassCard>
              <View style={styles.totalsGrid}>
                <View style={styles.totalCell}>
                  <Text style={[styles.totalValue, { color: ink }]}>
                    {totals.doneToday}/{totals.dueToday}
                  </Text>
                  <Text style={[styles.totalLabel, { color: sub }]}>Today</Text>
                </View>
                <View style={styles.totalCell}>
                  <Text style={[styles.totalValue, { color: ink }]}>{totals.completions}</Text>
                  <Text style={[styles.totalLabel, { color: sub }]}>Completions</Text>
                </View>
                <View style={styles.totalCell}>
                  <Text style={[styles.totalValue, { color: ink }]}>{totals.best}</Text>
                  <Text style={[styles.totalLabel, { color: sub }]}>Best streak</Text>
                </View>
                <View style={styles.totalCell}>
                  <Text style={[styles.totalValue, { color: ink }]}>{totals.habits}</Text>
                  <Text style={[styles.totalLabel, { color: sub }]}>Habits</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <GlassCard>
              <Pressable onPress={() => router.push(`/habit/${item.habit.id}`)}>
                <View style={styles.rowHeader}>
                  <Text style={styles.emoji}>{item.habit.emoji ?? '•'}</Text>
                  <Text style={[styles.name, { color: ink }]} numberOfLines={1}>
                    {item.habit.name}
                  </Text>
                  <Text style={[styles.rate, { color: sub }]}>{Math.round(item.rate * 100)}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(item.rate * 100)}%`, backgroundColor: item.habit.color }]} />
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: sub }]}>🔥 {item.streak.current} current</Text>
                  <Text style={[styles.meta, { color: sub }]}>🏆 {item.streak.best} best</Text>
                  <Text style={[styles.meta, { color: sub }]}>{item.total} total</Text>
                </View>
              </Pressable>
            </GlassCard>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 2, marginBottom: 16 },
  list: { paddingBottom: 32 },
  headerCard: { marginBottom: 12 },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  totalCell: { width: '50%', alignItems: 'center', paddingVertical: 8 },
  totalValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  totalLabel: { fontSize: 12, marginTop: 2 },
  cardWrap: { marginBottom: 12 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emoji: { fontSize: 18, marginRight: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  rate: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(128,128,128,0.25)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  meta: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
