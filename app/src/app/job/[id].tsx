import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { jobsService, actionsService } from '../services/modules';
import type { Job } from '../types/api';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

type ApplyState = 'idle' | 'applying' | 'applied' | 'unapplying';
type FavState = 'idle' | 'favoriting' | 'favorited' | 'unfavoriting';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [adjacent, setAdjacent] = useState<{ prev: Job | null; next: Job | null }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [applyState, setApplyState] = useState<ApplyState>('idle');
  const [favState, setFavState] = useState<FavState>('idle');

  const sheetRef = useRef<BottomSheet>(null);
  const translateX = useSharedValue(0);

  // Cargar detalle + adyacentes para swipe
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    jobsService.getById(id)
      .then((j) => {
        setJob(j);
        return Promise.all([
          j.id !== 'job_001' ? jobsService.getById(prevId(j.id)).catch(() => null) : Promise.resolve(null),
          jobsService.getById(nextId(j.id)).catch(() => null),
        ]);
      })
      .then(([prev, next]) => setAdjacent({ prev, next }))
      .catch((e) => setError(e?.message ?? 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setTimeout(() => sheetRef.current?.expand(), 100);
  }, []);

  const navigateTo = (newId: string) => {
    router.replace({ pathname: '/job/[id]', params: { id: newId } });
  };

  // Gesture swipe horizontal sobre el contenido del sheet
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD && adjacent.next) {
        runOnJS(navigateTo)(adjacent.next.id);
      } else if (e.translationX > SWIPE_THRESHOLD && adjacent.prev) {
        runOnJS(navigateTo)(adjacent.prev.id);
      }
      translateX.value = withTiming(0, { duration: 200 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(Math.abs(translateX.value), [0, SCREEN_W * 0.3], [1, 0.7]),
  }));

  const onApply = async () => {
    if (!job || applyState === 'applying') return;
    setApplyState('applying');
    try {
      await actionsService.apply(job.id);
      setApplyState('applied');
    } catch (e: any) {
      if (e?.code === 'ALREADY_APPLIED') {
        setApplyState('applied');
        Alert.alert('Ya aplicaste', 'Ya tienes una aplicación activa para esta vacante.');
      } else if (e?.code === 'AUTH_REQUIRED' || e?.code === 'TOKEN_EXPIRED') {
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Error', e?.message ?? 'No se pudo aplicar');
        setApplyState('idle');
      }
    }
  };

  const onToggleFav = async () => {
    if (!job) return;
    try {
      if (favState === 'favorited' || favState === 'unfavoriting') {
        setFavState('unfavoriting');
        await actionsService.unfavorite(job.id);
        setFavState('idle');
      } else {
        setFavState('favoriting');
        await actionsService.favorite(job.id);
        setFavState('favorited');
      }
    } catch (e: any) {
      if (e?.code === 'ALREADY_FAVORITED') setFavState('favorited');
      else if (e?.code === 'AUTH_REQUIRED' || e?.code === 'TOKEN_EXPIRED') router.replace('/(auth)/login');
      else Alert.alert('Error', e?.message ?? 'No se pudo actualizar favorito');
      setFavState('idle');
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={['60%', '100%']}
      backdropComponent={(p) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} />}
      onChange={(i) => setExpanded(i === 1)}
      enablePanDownToClose
      onClose={() => router.back()}
    >
      {loading || !job ? (
        <View style={styles.center}>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <ActivityIndicator size="large" color="#003DA5" />
          )}
        </View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.content, cardStyle]}>
            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.company} · {job.city}</Text>
              <Text style={styles.salary}>{job.salary ? `$${job.salary.toLocaleString('es-MX')}/mes` : 'Salario no mostrado'}</Text>

              <Text style={styles.description}>
                {expanded || job.description.length < 400
                  ? job.description
                  : `${job.description.slice(0, 400)}…`}
              </Text>

              <View style={styles.tags}>
                {job.tags.map((t) => (
                  <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                ))}
              </View>

              <Text style={styles.hint}>Desliza ← → para cambiar de vacante</Text>
            </BottomSheetScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.favBtn, favState === 'favorited' && styles.favBtnActive]}
                onPress={onToggleFav}
              >
                <Text style={styles.favText}>{favState === 'favorited' ? '★ Favorito' : '☆ Favorito'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, applyState === 'applied' && styles.applyBtnApplied]}
                onPress={onApply}
                disabled={applyState === 'applying' || applyState === 'applied'}
              >
                <Text style={styles.applyText}>
                  {applyState === 'applied' ? '✓ Aplicado' : applyState === 'applying' ? 'Aplicando…' : 'Aplicar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </GestureDetector>
      )}
    </BottomSheet>
  );
}

function prevId(id: string): string {
  const n = Number(id.split('_')[1]);
  return `job_${String(Math.max(1, n - 1)).padStart(3, '0')}`;
}
function nextId(id: string): string {
  const n = Number(id.split('_')[1]);
  return `job_${String(Math.min(90, n + 1)).padStart(3, '0')}`;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  error: { color: '#d94152' },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#132238' },
  company: { fontSize: 16, color: '#003DA5', marginTop: 6, fontWeight: '600' },
  salary: { fontSize: 14, color: '#18a965', fontWeight: '700', marginTop: 8 },
  description: { fontSize: 15, color: '#132238', lineHeight: 22, marginTop: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 20 },
  tag: { backgroundColor: '#e6efff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, color: '#003DA5', fontWeight: '600' },
  hint: { fontSize: 11, color: '#607086', textAlign: 'center', marginTop: 24 },
  actions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f1f5fa',
  },
  favBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5fa' },
  favBtnActive: { backgroundColor: '#FFC72C' },
  favText: { color: '#003DA5', fontWeight: '800' },
  applyBtn: { flex: 2, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#003DA5' },
  applyBtnApplied: { backgroundColor: '#18a965' },
  applyText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
