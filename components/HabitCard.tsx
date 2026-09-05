import * as Haptics from 'expo-haptics';
import { Check, Flame, Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';
import type { Habit } from '../store/useHabitStore';

interface Props {
  habit: Habit;
  count: number;
  streak: number;
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress?: () => void;
}

export default function HabitCard({ habit, count, streak, onToggle, onIncrement, onDecrement, onPress }: Props) {
  const target = Math.max(1, habit.timesPerDay);
  const done = count >= target;
  const isCounter = target > 1;
  const dark = useColorScheme() === 'dark';
  const ink = dark ? '#fff' : '#111';
  const sub = dark ? '#a1a1aa' : '#6b7280';

  const buzz = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // haptics unavailable (e.g. web)
    }
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.left} onPress={onPress} disabled={!onPress}>
        {habit.emoji ? <Text style={styles.emoji}>{habit.emoji}</Text> : null}
        <View style={styles.meta}>
          <Text style={[styles.name, { color: ink }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.sub}>
            <Flame size={13} color={streak > 0 ? '#f59e0b' : '#9ca3af'} />
            <Text style={[styles.streak, { color: sub }]}>{streak}</Text>
            {isCounter ? (
              <Text style={[styles.progress, { color: sub }]}>
                {Math.min(count, target)}/{target}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      {isCounter ? (
        <View style={styles.counter}>
          <Pressable
            accessibilityLabel={`Decrease ${habit.name}`}
            onPress={() => {
              buzz();
              onDecrement();
            }}
            style={styles.stepBtn}
          >
            <Minus size={16} color={dark ? '#fff' : '#111'} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Increase ${habit.name}`}
            onPress={() => {
              buzz();
              onIncrement();
            }}
            style={[styles.stepBtn, dark && styles.stepBtnDark, done && styles.stepBtnDone]}
          >
            <Plus size={16} color={done || dark ? '#fff' : '#111'} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel={`Toggle ${habit.name}`}
          accessibilityState={{ checked: done }}
          onPress={() => {
            buzz();
            onToggle();
          }}
          style={[styles.toggle, done && { backgroundColor: habit.color, borderColor: habit.color }]}
        >
          {done ? <Check size={18} color="#fff" /> : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  emoji: {
    fontSize: 26,
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  streak: {
    fontSize: 13,
    color: '#6b7280',
    fontVariant: ['tabular-nums'],
  },
  progress: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  toggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  counter: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDark: {
    backgroundColor: '#27272a',
  },
  stepBtnDone: {
    backgroundColor: '#111',
  },
});
