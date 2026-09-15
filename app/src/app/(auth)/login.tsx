import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../../services/modules';
import { useSessionStore } from '../../../store/session';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState('test@occ.com.mx');
  const [password, setPassword] = useState('Test1234');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Datos faltantes', 'Captura email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authService.login(email, password);
      setSession(token, user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>OCC</Text>
      <Text style={styles.subtitle}>Encuentra tu próxima oportunidad</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={onLogin}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
      </TouchableOpacity>

      <Text style={styles.hint}>Demo: test@occ.com.mx / Test1234</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#003DA5' },
  brand: { fontSize: 64, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 4 },
  subtitle: { fontSize: 16, color: '#cfe2ff', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#FFC72C', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#003DA5', fontWeight: '900', fontSize: 16 },
  hint: { color: '#cfe2ff', textAlign: 'center', marginTop: 20, fontSize: 12 },
});
