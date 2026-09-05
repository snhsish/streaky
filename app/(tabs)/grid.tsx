import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import ContributionGrid from '@/components/ContributionGrid';
import GlassCard from '@/components/GlassCard';
import { getStreak } from '@/lib/streak';
import { useHabitStore } from '@/store/useHabitStore';

export default function GridScreen() {
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const today = useMemo(() => new Date(), []);
  const visible = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';

  if (visible.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
        <Text style={[styles.title, { color: ink }]}>Grid</Text>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: sub }]}>No habits yet. Habits you add will show up here.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: ink }]}>Grid</Text>
      <Text style={[styles.sub, { color: sub }]}>Last 16 weeks · tap to open</Text>
      <FlatList
        data={visible}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <GlassCard>
              <Pressable onPress={() => router.push(`/habit/${item.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.emoji}>{item.emoji ?? '•'}</Text>
                  <Text style={[styles.name, { color: ink }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.streak, { color: sub }]}>{getStreak(item, logs, today).current}🔥</Text>
                </View>
                <ContributionGrid habit={item} habitLogs={logs[item.id] ?? {}} weeks={16} cellSize={11} />
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
  cardWrap: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emoji: { fontSize: 18, marginRight: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  streak: { fontSize: 13, fontVariant: ['tabular-nums'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
