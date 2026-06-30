import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import client from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D9E75',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenData.data;

  try {
    await client.post('/notifications/register', { token });
  } catch (e) {
    console.error('Push token registration failed', e);
  }
  return token;
}

export async function unregisterPush() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await client.delete('/notifications/register', { data: { token: tokenData.data } });
  } catch {}
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// appointments must have a dateTime field and an optional client { firstName, lastName }
export async function scheduleAppointmentReminders(appointments) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const a of appointments) {
    const when = new Date(a.dateTime).getTime();
    if (isNaN(when)) continue;
    const clientName = a.client ? `${a.client.firstName} ${a.client.lastName}` : 'Client';

    const oneHourBefore = when - 60 * 60 * 1000;
    if (oneHourBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Rendez-vous bientôt', body: `${clientName} dans 1 heure.` },
        trigger: { type: 'date', date: new Date(oneHourBefore) },
      });
    }
    if (when > now) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Rendez-vous', body: `Rendez-vous avec ${clientName} maintenant.` },
        trigger: { type: 'date', date: new Date(when) },
      });
    }
  }
}
