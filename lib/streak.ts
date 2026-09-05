import { addDays, format, startOfWeek } from 'date-fns';
import { parseDayKey, toDayKey, weekdayOf } from './dates';
import type { Habit, Logs } from '../store/useHabitStore';

function createdDayKey(habit: Habit): string {
  return toDayKey(new Date(habit.createdAt));
}

export function isComplete(habit: Habit, count: number): boolean {
  return count >= Math.max(1, habit.timesPerDay);
}

function isRequiredDaily(habit: Habit, dayKey: string): boolean {
  if (dayKey < createdDayKey(habit)) return false;
  const f = habit.frequency;
  if (f.kind === 'daily') return true;
  if (f.kind === 'weekdays') return f.days.includes(weekdayOf(dayKey));
  return true;
}

export function isDue(habit: Habit, date: Date = new Date()): boolean {
  if (habit.archived) return false;
  const key = toDayKey(date);
  if (key < createdDayKey(habit)) return false;
  const f = habit.frequency;
  if (f.kind === 'weekdays') return f.days.includes(date.getDay());
  return true;
}

function weekStartKey(dayKey: string): string {
  return format(startOfWeek(parseDayKey(dayKey), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function weekMeetsTarget(habit: Habit, habitLogs: Record<string, number>, weekKey: string): boolean {
  if (habit.frequency.kind !== 'xPerWeek') return false;
  const target = habit.frequency.target;
  let done = 0;
  for (let i = 0; i < 7; i += 1) {
    const k = format(addDays(parseDayKey(weekKey), i), 'yyyy-MM-dd');
    if (isComplete(habit, habitLogs[k] ?? 0)) done += 1;
  }
  return done >= target;
}

function dailyStreak(habit: Habit, habitLogs: Record<string, number>, todayKey: string): { current: number; best: number } {
  const startKey = createdDayKey(habit);
  let best = 0;
  let run = 0;
  const k = startKey <= todayKey ? startKey : todayKey;
  let cur = k;
  let guard = 0;
  while (cur <= todayKey && guard < 5000) {
    if (isRequiredDaily(habit, cur)) {
      if (isComplete(habit, habitLogs[cur] ?? 0)) run += 1;
      else {
        if (run > best) best = run;
        run = 0;
      }
    }
    cur = format(addDays(parseDayKey(cur), 1), 'yyyy-MM-dd');
    guard += 1;
  }
  if (run > best) best = run;

  let current = 0;
  cur = todayKey;
  guard = 0;
  let skippedToday = false;
  while (cur >= startKey && guard < 5000) {
    if (!isRequiredDaily(habit, cur)) {
      cur = format(addDays(parseDayKey(cur), -1), 'yyyy-MM-dd');
      guard += 1;
      continue;
    }
    const done = isComplete(habit, habitLogs[cur] ?? 0);
    if (done) current += 1;
    else if (cur === todayKey && !skippedToday) {
      skippedToday = true;
    } else break;
    cur = format(addDays(parseDayKey(cur), -1), 'yyyy-MM-dd');
    guard += 1;
  }
  return { current, best };
}

function weeklyStreak(habit: Habit, habitLogs: Record<string, number>, todayKey: string): { current: number; best: number } {
  const firstWeek = weekStartKey(createdDayKey(habit));
  const thisWeek = weekStartKey(todayKey);
  const weeks: string[] = [];
  let cur = firstWeek;
  let guard = 0;
  while (cur <= thisWeek && guard < 520) {
    weeks.push(cur);
    cur = format(addDays(parseDayKey(cur), 7), 'yyyy-MM-dd');
    guard += 1;
  }
  let best = 0;
  let run = 0;
  const met = weeks.map((w) => weekMeetsTarget(habit, habitLogs, w));
  for (let i = 0; i < met.length; i += 1) {
    const isCurrentWeek = i === met.length - 1;
    if (met[i]) run += 1;
    else if (isCurrentWeek) {
      // partial week still completable: don't break yet
    } else {
      if (run > best) best = run;
      run = 0;
    }
  }
  if (run > best) best = run;

  let current = 0;
  for (let i = met.length - 1; i >= 0; i -= 1) {
    const isCurrentWeek = i === met.length - 1;
    if (met[i]) current += 1;
    else if (isCurrentWeek) continue;
    else break;
  }
  return { current, best };
}

export function getStreak(habit: Habit, logs: Logs, today: Date = new Date()): { current: number; best: number } {
  const habitLogs = logs[habit.id] ?? {};
  const todayKey = toDayKey(today);
  if (habit.archived) return { current: 0, best: 0 };
  if (habit.frequency.kind === 'xPerWeek') return weeklyStreak(habit, habitLogs, todayKey);
  return dailyStreak(habit, habitLogs, todayKey);
}
