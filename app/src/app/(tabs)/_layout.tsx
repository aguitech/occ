import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../../store/session';

export default function TabsLayout() {
  const { token, hydrated } = useSessionStore();
  if (hydrated && !token) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="activity" />
    </Stack>
  );
}
