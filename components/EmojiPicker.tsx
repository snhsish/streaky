import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

const PRESETS = ['📚', '💧', '🏋️', '🧘', '🏃', '💤', '🥗', '📝', '🎸', '🧹', '💰', '📵', '🌱', '🔥', '⭐', '🎯'];

interface Props {
  value?: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  const dark = useColorScheme() === 'dark';
  const ink = dark ? '#fff' : '#111';

  return (
    <View>
      <View style={styles.previewRow}>
        <View style={[styles.preview, { borderColor: 'rgba(128,128,128,0.35)' }]}>
          <Text style={styles.previewText}>{value || '•'}</Text>
        </View>
        {value ? (
          <Pressable style={styles.clearBtn} onPress={() => onChange('')}>
            <Text style={[styles.clearText, { color: ink }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.grid}>
        {PRESETS.map((e) => {
          const selected = value === e;
          return (
            <Pressable
              key={e}
              accessibilityLabel={`Emoji ${e}`}
              onPress={() => onChange(selected ? '' : e)}
              style={[styles.cell, selected && { borderColor: ink, borderWidth: 2 }]}
            >
              <Text style={styles.cellText}>{e}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  preview: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 28,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  cellText: {
    fontSize: 24,
  },
});
