import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initApi } from '../src/services/init';
import { useSessionStore } from '../src/store/session';
import { configureNotifications } from '../src/features/notifications/service';

export default function RootLayout() {
  useEffect(() => {
    initApi();
    configureNotifications();
    // Validar token al arrancar
    useSessionStore.getState().validateToken();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
