import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { actionsService } from '../services/modules';

export default function ActivityScreen() {
  const [tab, setTab] = useState<'applications' | 'favorites'>('applications');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = tab === 'applications'
        ? await actionsService.applications()
        : await actionsService.favorites();
      setItems(data.items);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const onCancel = async (jobId: string) => {
    try {
      if (tab === 'applications') await actionsService.unapply(jobId);
      else await actionsService.unfavorite(jobId);
      setItems((prev) => prev.filter((j) => j.id !== jobId));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo cancelar');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis actividades</Text>
        <View style={styles.tabBar}>
          <TabButton active={tab === 'applications'} label={`Aplicaciones`} onPress={() => setTab('applications')} />
          <TabButton active={tab === 'favorites'} label={`Favoritos`} onPress={() => setTab('favorites')} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#003DA5" style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>{tab === 'applications' ? 'Aún no has aplicado a vacantes.' : 'No tienes favoritos.'}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((job) => (
            <View key={job.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobMeta}>{job.company} · {job.city}</Text>
              </View>
              <TouchableOpacity onPress={() => onCancel(job.id)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{tab === 'applications' ? 'Cancelar' : 'Quitar'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5fa' },
  header: { backgroundColor: '#003DA5', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: '#002a75', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFC72C' },
  tabText: { color: '#fff', fontWeight: '700' },
  tabTextActive: { color: '#003DA5' },
  empty: { textAlign: 'center', marginTop: 40, color: '#607086' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#132238' },
  jobMeta: { fontSize: 12, color: '#607086', marginTop: 2 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fee', borderRadius: 8 },
  cancelText: { color: '#d94152', fontWeight: '700', fontSize: 12 },
});
