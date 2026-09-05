import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from '../store/useHabitStore';

const CHANNEL_ID = 'habit-reminders';

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function remindersGranted(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelHabitReminders(habitId: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const mine = scheduled.filter((n) => (n.content.data?.habitId as string | undefined) === habitId);
    await Promise.all(mine.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {
    // notifications unavailable (e.g. web)
  }
}

export async function scheduleHabitReminder(habit: Habit): Promise<boolean> {
  if (!habit.reminderTime || habit.archived) {
    await cancelHabitReminders(habit.id);
    return true;
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(habit.reminderTime.trim());
  if (!match) return false;
  try {
    const ok = await remindersGranted();
    if (!ok) return false;
    await cancelHabitReminders(habit.id);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.emoji ? `${habit.emoji} ` : ''}${habit.name}`,
        body: 'Time to keep your streak alive.',
        data: { habitId: habit.id, url: `/habit/${habit.id}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Number(match[1]),
        minute: Number(match[2]),
        channelId: CHANNEL_ID,
      },
    });
    return true;
  } catch {
    return false;
  }
}
