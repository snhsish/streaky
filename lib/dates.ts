import { addDays, format, parse } from 'date-fns';

export function toDayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDayKey(dayKey: string): Date {
  return parse(dayKey, 'yyyy-MM-dd', new Date());
}

export function dayKeyOf(date: Date): string {
  return toDayKey(date);
}

export function addDayKeys(dayKey: string, delta: number): string {
  return toDayKey(addDays(parseDayKey(dayKey), delta));
}

export function* eachDayKey(fromKey: string, toKey: string): Generator<string> {
  let cur = fromKey;
  let guard = 0;
  while (cur <= toKey && guard < 5000) {
    yield cur;
    cur = addDayKeys(cur, 1);
    guard += 1;
  }
}

export function weekdayOf(dayKey: string): number {
  return parseDayKey(dayKey).getDay();
}
