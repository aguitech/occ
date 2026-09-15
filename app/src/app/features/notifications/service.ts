import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

const CHANNEL_ID = 'occ-jobs';

export async function configureNotifications(): Promise<void> {
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Vacantes OCC',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Handle deep link cuando el usuario toca la notificación
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.jobId) {
        router.push(`/job/${detail.notification.data.jobId}`);
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.jobId) {
        // En background solo guardamos; onForegroundEvent maneja cuando app vive
        const jobId = detail.notification.data.jobId;
        await Linking.openURL(`occ://vacante/${jobId}`);
      }
    });
  } catch (e) {
    console.warn('[notifications] configureNotifications falló:', e);
  }
}

export async function showNewJobNotification(jobId: string, title: string, body: string): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    data: { jobId },
    android: {
      channelId: CHANNEL_ID,
      pressAction: { id: 'default' },
      smallIcon: 'ic_notification',
    },
    ios: {
      sound: 'default',
    },
  });
}
