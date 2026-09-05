import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

const PRESETS = ['#111111', '#6b7280', '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorDotPicker({ value, onChange }: Props) {
  const dark = useColorScheme() === 'dark';
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';
  const [custom, setCustom] = useState(value && !PRESETS.includes(value) ? value : '');

  const commitCustom = () => {
    const hex = custom.trim();
    if (/^#([0-9a-fA-F]{6})$/.test(hex)) onChange(hex);
  };

  return (
    <View>
      <View style={styles.row}>
        {PRESETS.map((c) => {
          const selected = value.toLowerCase() === c.toLowerCase();
          return (
            <Pressable
              key={c}
              accessibilityLabel={`Color ${c}`}
              onPress={() => onChange(c)}
              style={[
                styles.dot,
                { backgroundColor: c, borderColor: c === '#FFFFFF' || c === '#ffffff' ? '#d1d5db' : 'transparent' },
                selected && { borderColor: ink, borderWidth: 3 },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.customRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onBlur={commitCustom}
          onSubmitEditing={commitCustom}
          placeholder="#111111"
          placeholderTextColor={sub}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          style={[styles.input, { color: ink, borderColor: 'rgba(128,128,128,0.35)' }]}
        />
        <Pressable style={styles.applyBtn} onPress={commitCustom}>
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  applyBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  applyText: {
    color: '#fff',
    fontWeight: '600',
  },
});
