import { Stack } from 'expo-router';
import { useSessionStore } from '../../store/session';

export default function AuthLayout() {
  const { token, hydrated } = useSessionStore();
  if (hydrated && token) return null; // si ya hay sesión, no muestra login

  return <Stack screenOptions={{ headerShown: false }} />;
}
