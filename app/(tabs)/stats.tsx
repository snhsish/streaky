import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function StatsScreen() {
  const dark = useColorScheme() === 'dark';
  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: dark ? '#fff' : '#111' }]}>Stats</Text>
      <Text style={styles.sub}>Totals and best streaks land in Phase 4.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
