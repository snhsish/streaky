import type { Habit } from '../store/useHabitStore';

export function createSeedHabits(): Omit<Habit, 'id' | 'createdAt' | 'archived'>[] {
  return [
    {
      name: 'Read 10 pages',
      emoji: '📚',
      color: '#111111',
      frequency: { kind: 'daily' },
      timesPerDay: 1,
      reminderTime: '08:00',
    },
    {
      name: 'Drink water',
      emoji: '💧',
      color: '#2563eb',
      frequency: { kind: 'daily' },
      timesPerDay: 8,
    },
    {
      name: 'Gym',
      emoji: '🏋️',
      color: '#16a34a',
      frequency: { kind: 'xPerWeek', target: 3 },
      timesPerDay: 1,
      reminderTime: '18:00',
    },
  ];
}
