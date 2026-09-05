import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import GlassCard from '@/components/GlassCard';
import HabitCard from '@/components/HabitCard';
import { toDayKey } from '@/lib/dates';
import { createSeedHabits } from '@/lib/seed';
import { getStreak, isComplete, isDue } from '@/lib/streak';
import { useHabitStore } from '@/store/useHabitStore';

export default function TodayScreen() {
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const addHabit = useHabitStore((s) => s.addHabit);
  const toggleDay = useHabitStore((s) => s.toggleDay);
  const increment = useHabitStore((s) => s.increment);
  const decrement = useHabitStore((s) => s.decrement);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDayKey(today);

  const due = useMemo(
    () =>
      habits
        .filter((h) => !h.archived && isDue(h, today))
        .sort((a, b) => (a.reminderTime ?? '99:99').localeCompare(b.reminderTime ?? '99:99') || a.name.localeCompare(b.name)),
    [habits, today],
  );

  const doneCount = due.filter((h) => isComplete(h, logs[h.id]?.[todayKey] ?? 0)).length;
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: ink }]}>Today</Text>
        <Pressable
          accessibilityLabel="Add habit"
          onPress={() => router.push('/create')}
          style={[styles.addBtn, { borderColor: 'rgba(128,128,128,0.35)' }]}
        >
          <Plus size={20} color={ink} />
        </Pressable>
      </View>
      <Text style={[styles.subtitle, { color: sub }]}>
        {format(today, 'EEEE, MMM d')} · {doneCount}/{due.length} done
      </Text>
      {due.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: sub }]}>No habits due. Add a habit to start your streak.</Text>
          <Pressable
            style={styles.seedBtn}
            onPress={() => {
              for (const s of createSeedHabits()) addHabit(s);
            }}
          >
            <Text style={styles.seedBtnText}>Add sample habits</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={due}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <GlassCard>
                <HabitCard
                  habit={item}
                  count={logs[item.id]?.[todayKey] ?? 0}
                  streak={getStreak(item, logs, today).current}
                  onToggle={() => toggleDay(item.id, todayKey)}
                  onIncrement={() => increment(item.id, todayKey)}
                  onDecrement={() => decrement(item.id, todayKey)}
                  onPress={() => router.push(`/habit/${item.id}`)}
                />
              </GlassCard>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 32,
  },
  cardWrap: {
    marginBottom: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  seedBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  seedBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
