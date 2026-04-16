import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Plant } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWateringNotification(plant: Plant): Promise<string | null> {
  if (!plant.notificationEnabled) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  if (plant.notificationId) {
    await cancelNotification(plant.notificationId);
  }

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: plant.notificationHour,
    minute: plant.notificationMinute,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💧 Il est l'heure d'arroser ${plant.name} !`,
      body: `Votre ${plant.name} a besoin d'eau aujourd'hui. N'oubliez pas !`,
      sound: true,
      data: { plantId: plant.id },
    },
    trigger,
  });

  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already cancelled or doesn't exist
  }
}

export async function cancelAllPlantNotifications(plants: Plant[]): Promise<void> {
  for (const plant of plants) {
    if (plant.notificationId) {
      await cancelNotification(plant.notificationId);
    }
  }
}

export function getNextWateringDate(plant: Plant): Date | null {
  if (!plant.lastWatered) {
    return new Date();
  }
  const last = new Date(plant.lastWatered);
  const next = new Date(last);
  next.setDate(next.getDate() + plant.wateringFrequencyDays);
  return next;
}

export function getDaysUntilWatering(plant: Plant): number {
  const next = getNextWateringDate(plant);
  if (!next) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWateringStatus(plant: Plant): 'overdue' | 'today' | 'soon' | 'ok' {
  const days = getDaysUntilWatering(plant);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 2) return 'soon';
  return 'ok';
}
