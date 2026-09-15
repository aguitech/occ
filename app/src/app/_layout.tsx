import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initApi, hydrateFromWebStorage } from './services/init';
import { useSessionStore } from './store/session';
import { configureNotifications } from './features/notifications/service';

export default function RootLayout() {
  useEffect(() => {
    initApi();
    hydrateFromWebStorage();
    useSessionStore.getState().validateToken();
    configureNotifications();
    // eslint-disable-next-line no-console
    console.log('[OCC] hydrateFromWebStorage ejecutado');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
