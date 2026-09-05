import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toDayKey } from '../lib/dates';
import { zustandStorage } from '../lib/storage';

export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] }
  | { kind: 'xPerWeek'; target: number };

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color: string;
  frequency: Frequency;
  timesPerDay: number;
  reminderTime?: string;
  createdAt: string;
  archived: boolean;
}

export type Logs = Record<string, Record<string, number>>;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface HabitState {
  habits: Habit[];
  logs: Logs;
  addHabit: (input: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => Habit;
  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  removeHabit: (id: string) => void;
  archiveHabit: (id: string, archived?: boolean) => void;
  getCount: (habitId: string, dayKey?: string) => number;
  setCount: (habitId: string, dayKey: string, count: number) => void;
  toggleDay: (habitId: string, dayKey?: string) => void;
  increment: (habitId: string, dayKey?: string) => void;
  decrement: (habitId: string, dayKey?: string) => void;
  clearAll: () => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: {},
      addHabit: (input) => {
        const habit: Habit = {
          ...input,
          timesPerDay: Math.max(1, Math.floor(input.timesPerDay || 1)),
          id: newId(),
          createdAt: new Date().toISOString(),
          archived: false,
        };
        set((s) => ({ habits: [...s.habits, habit] }));
        return habit;
      },
      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),
      removeHabit: (id) =>
        set((s) => {
          const logs = { ...s.logs };
          delete logs[id];
          return { habits: s.habits.filter((h) => h.id !== id), logs };
        }),
      archiveHabit: (id, archived = true) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, archived } : h)),
        })),
      getCount: (habitId, dayKey = toDayKey()) => get().logs[habitId]?.[dayKey] ?? 0,
      setCount: (habitId, dayKey, count) =>
        set((s) => {
          const habit = s.habits.find((h) => h.id === habitId);
          const cap = habit ? Math.max(1, habit.timesPerDay) : Math.max(0, count);
          const next = Math.max(0, Math.min(cap, Math.floor(count)));
          const prev = { ...(s.logs[habitId] ?? {}) };
          if (next <= 0) delete prev[dayKey];
          else prev[dayKey] = next;
          const logs = { ...s.logs };
          if (Object.keys(prev).length === 0) delete logs[habitId];
          else logs[habitId] = prev;
          return { logs };
        }),
      toggleDay: (habitId, dayKey = toDayKey()) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return;
        const target = Math.max(1, habit.timesPerDay);
        const cur = get().logs[habitId]?.[dayKey] ?? 0;
        get().setCount(habitId, dayKey, cur >= target ? 0 : target);
      },
      increment: (habitId, dayKey = toDayKey()) => {
        const cur = get().logs[habitId]?.[dayKey] ?? 0;
        get().setCount(habitId, dayKey, cur + 1);
      },
      decrement: (habitId, dayKey = toDayKey()) => {
        const cur = get().logs[habitId]?.[dayKey] ?? 0;
        get().setCount(habitId, dayKey, cur - 1);
      },
      clearAll: () => set({ habits: [], logs: {} }),
    }),
    {
      name: 'streaky-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({ habits: s.habits, logs: s.logs }),
    },
  ),
);
