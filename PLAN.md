# Streaky — PLAN.md

Minimalist habit tracker (React Native + Expo, iOS + Android).
GitHub-style binary contribution grid (filled / unfilled, no heatmap), customizable color + emoji/icon per habit. Black/white theme with glassmorphism. Local-first, no backend. Google Drive backup later.

## Decisions (locked)

- Frequency: full flexible — daily + specific weekdays + X-times/week + X-times/day counter.
- Streak: strict — missing a required day resets current streak to 0.
- MVP extras: local reminders + stats screen. No widgets in v1.

## Tech Stack

| Area | Choice | Why |
|---|---|---|
| Framework | Expo SDK (~53/54), TypeScript, Expo Router (tabs + stack) | iOS+Android, file routing, OTA via EAS Update |
| Styling / UI | NativeWind v4 (Tailwind) + expo-blur + expo-linear-gradient | Lightweight, true B/W minimalism, custom glass cards. Rejected Tamagui/Gluestack (heavy) |
| Icons / Emoji | lucide-react-native + rn-emoji-keyboard + expo-symbols | Custom icon/emoji per habit |
| Animation | react-native-reanimated + expo-haptics | Tap feedback, grid pop |
| State | zustand (+ persist middleware) | Tiny, no boilerplate |
| Storage | react-native-mmkv (+ AsyncStorage fallback) | Sync, fast key-value for habits/logs/settings |
| Dates | date-fns | Streak + grid bucketing |
| Reminders | expo-notifications | Local push, no server |
| Color picker | custom ColorDotPicker (preset swatches + hex input) | Avoid heavy dep; add `react-native-color-picker` only if needed |
| Backup (Phase 2) | expo-auth-session + Google Drive AppDataFolder (JSON dump/restore) | No backend needed |

## Architecture

```
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx        # Today — due habits, toggle/ counter
    grid.tsx         # All habits overview grids
    stats.tsx        # Totals, best streak, completion %
    settings.tsx     # Theme, export placeholder, about
  habit/[id].tsx      # Detail + large contribution grid + edit
  create.tsx          # New habit: name, emoji, color, frequency, reminder
components/
  GlassCard.tsx       # expo-blur wrapper, B/W translucent
  HabitCard.tsx       # Row: emoji, name, streak, toggle button
  ContributionGrid.tsx# 7 x N weeks binary grid (filled = habit.color)
  ColorDotPicker.tsx  # Swatch + custom hex
  EmojiPicker.tsx     # Wrapper over rn-emoji-keyboard
store/
  useHabitStore.ts    # habits, logs, actions (toggle, add, archive)
lib/
  dates.ts            # day keys (YYYY-MM-DD), week buckets
  streak.ts           # required-day calc, current/best streak (strict)
  storage.ts          # MMKV instance + persist adapter
  notifications.ts    # schedule/cancel reminders
  seed.ts             # Dev sample habits (dev only)
```

## Data Model

```ts
type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] } // 0=Sun..6=Sat
  | { kind: 'xPerWeek'; target: number };

interface Habit {
  id: string;
  name: string;
  emoji?: string;
  icon?: string; // lucide name fallback
  color: string; // hex, default '#FFFFFF' / '#111111'
  frequency: Frequency;
  timesPerDay: number; // default 1
  reminderTime?: string; // 'HH:mm'
  createdAt: string; // ISO
  archived: boolean;
}
// logs: Record<habitId, Record<dayKey, count>>
// dayKey = 'YYYY-MM-DD' local time
```

Grid cell: `count > 0 → fill habit.color, else translucent white/black (theme dependent)`. No opacity scaling.

## Streak Logic (strict)

- Required day = due per frequency and `createdAt <= day` and not archived.
- `current`: walk back from today; break on first missed required day → 0 if today/yesterday missed per rules.
- `best`: max run over full history.
- `xPerWeek`: week bucket must meet target; a failed past week breaks the run.
- `timesPerDay`: day complete only if `count >= timesPerDay`.

## Screens (MVP)

1. Today: due list sorted by reminder, one-tap toggle / +/- counter, haptic, streak flame.
2. Detail (`habit/[id]`): big grid (last ~20 weeks), current/best, edit color/emoji/frequency, delete/archive.
3. Stats: completion %, totals, best streaks.
4. Settings: light/dark (B/W), export JSON (placeholder for Drive), clear data.

## Phases

- [x] 0 — Init: `create-expo-app` tabs + TS, NativeWind, MMKV, Zustand, lucide, reanimated, date-fns
- [x] 1 — Store + Today toggle (MMKV persist)
- [x] 2 — ContributionGrid + detail screen
- [x] 3 — Create/edit (emoji + color picker, flexible frequency)
- [x] 4 — Reminders + stats
- [x] 5 — Polish B/W glass theme + JSON export (Drive hook later)

## Commands (after init)

- `npx expo start` — dev
- `npx expo run:ios / run:android`
- `npx tsc --noEmit` — typecheck

## Out of Scope (v1)

Widgets, social/sharing, backend/sync, heatmap intensities.
