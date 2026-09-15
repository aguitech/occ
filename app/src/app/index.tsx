import { Redirect } from 'expo-router';
import { useSessionStore } from '../../store/session';
import { ActivityIndicator, View } from 'react-native';

export default function IndexRoute() {
  const { token, hydrated } = useSessionStore();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (token) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
