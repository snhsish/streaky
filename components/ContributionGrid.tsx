import * as Haptics from 'expo-haptics';
import { addDays, startOfWeek } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { toDayKey } from '../lib/dates';
import { isComplete } from '../lib/streak';
import type { Habit } from '../store/useHabitStore';

interface ContributionGridProps {
  habit: Habit;
  habitLogs: Record<string, number>;
  weeks?: number;
  cellSize?: number;
  gap?: number;
  endDate?: Date;
  onToggleDay?: (dayKey: string) => void;
}

export default function ContributionGrid({
  habit,
  habitLogs,
  weeks = 20,
  cellSize = 13,
  gap = 4,
  endDate = new Date(),
  onToggleDay,
}: ContributionGridProps) {
  const dark = useColorScheme() === 'dark';
  const todayKey = toDayKey(endDate);
  const createdKey = toDayKey(new Date(habit.createdAt));
  const emptyCell = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const columns = useMemo(() => {
    const start = startOfWeek(addDays(endDate, -(weeks - 1) * 7), { weekStartsOn: 1 });
    return Array.from({ length: weeks }, (_, col) => {
      const base = addDays(start, col * 7);
      return Array.from({ length: 7 }, (_, row) => {
        const date = addDays(base, row);
        const key = toDayKey(date);
        return { key, disabled: key > todayKey || key < createdKey };
      });
    });
  }, [endDate, weeks, todayKey, createdKey]);

  const buzz = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
    }
  };

  return (
    <View style={[styles.grid, { gap }]}>
      {columns.map((days, col) => (
        <View key={col} style={[styles.col, { gap }]}>
          {days.map(({ key, disabled }) => {
            const filled = isComplete(habit, habitLogs[key] ?? 0);
            const interactive = !!onToggleDay && !disabled;
            const cell = (
              <View
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: Math.max(3, Math.round(cellSize / 4)),
                    backgroundColor: filled ? habit.color : emptyCell,
                    opacity: disabled ? 0.35 : 1,
                  },
                ]}
              />
            );
            if (!interactive) return <View key={key}>{cell}</View>;
            return (
              <Pressable
                key={key}
                accessibilityLabel={`${habit.name} ${key}`}
                onPress={() => {
                  buzz();
                  onToggleDay?.(key);
                }}
                hitSlop={2}
              >
                {cell}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  cell: {
    borderWidth: 0,
  },
});
