import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function GridScreen() {
  const dark = useColorScheme() === 'dark';
  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: dark ? '#fff' : '#111' }]}>Grid</Text>
      <Text style={styles.sub}>Contribution grids land in Phase 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
