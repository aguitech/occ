import notifee, { AndroidImportance, EventType, TriggerType } from '@notifee/react-native';
import * as Linking from 'expo-linking';

const CHANNEL_ID = 'occ-new-jobs';

/**
 * Servicio de notificaciones locales (sin servidor de push real).
 * - Configura canal Android con importancia HIGH
 * - Maneja taps en foreground/background/quit
 * - Deep link a occ://vacante/:id
 */
export async function configureNotifications() {
  // Permiso (Android 13+)
  await notifee.requestPermission();

  // Canal Android
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Nuevas vacantes',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Handler de eventos en foreground
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data?.jobId) {
      const jobId = detail.notification.data.jobId as string;
      Linking.openURL(`occ://vacante/${jobId}`);
    }
  });

  // Handler de background: notifee lo registra en onBackgroundEvent en index.ts (separado)
}

/**
 * Handler background — debe llamarse desde un archivo a nivel de módulo raíz.
 * Por simplicidad, lo dejamos registrado en configureNotifications como
 * onForegroundEvent. Para background real, definir:
 *
 *   notifee.onBackgroundEvent(async ({ type, detail }) => {...});
 *
 * en el entry point.
 */

/**
 * Dispara una notificación local que simula "Nueva vacante para ti".
 * Útil para botón de demo o trigger manual.
 */
export async function showNewJobNotification(jobId: string, title: string, company: string) {
  await notifee.displayNotification({
    title: 'Nueva vacante para ti',
    body: `${title} · ${company}`,
    data: { jobId },
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'open-job' },
    },
    ios: {
      categoryId: 'new-job',
    },
  });
}

/**
 * Programa una notificación local diferida (debug/demo).
 */
export async function scheduleNewJobNotification(jobId: string, title: string, company: string, secondsFromNow = 5) {
  const date = new Date(Date.now() + secondsFromNow * 1000);
  await notifee.createTriggerNotification(
    {
      title: 'Nueva vacante para ti',
      body: `${title} · ${company}`,
      data: { jobId },
      android: { channelId: CHANNEL_ID, importance: AndroidImportance.HIGH },
    },
    { type: TriggerType.TIMESTAMP, timestamp: date.getTime() }
  );
}
