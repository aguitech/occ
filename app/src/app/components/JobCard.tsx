import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Job } from '../types/api';

type Props = { job: Job; onPress: () => void };

function fmtMoney(n?: number | null) {
  if (!n) return '—';
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function parseSalary(s?: string | null): [number | null, number | null] {
  if (!s) return [null, null];
  const str = String(s).replace(/[$,\s]/g, '');
  if (str.includes('-')) {
    const [a, b] = str.split('-').map((x) => parseInt(x, 10));
    return [a || null, b || null];
  }
  const n = parseInt(str, 10);
  return [n || null, null];
}

export default function JobCard({ job, onPress }: Props) {
  const [smin, smax] = parseSalary((job as any).salary);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.headerRow}>
        {(job as any).city && <View style={styles.pill}><Text style={styles.pillText}>{(job as any).city}</Text></View>}
        {(job as any).modality && <View style={[styles.pill, styles.pillAlt]}><Text style={styles.pillAltText}>{(job as any).modality}</Text></View>}
      </View>
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      <Text style={styles.company}>{job.company}</Text>
      {(smin || smax) && (
        <Text style={styles.salary}>
          {smin ? fmtMoney(smin) : '—'} {smax ? `– ${fmtMoney(smax)}` : ''} MXN
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#0B1E3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  pill: { backgroundColor: '#E8EEF7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillText: { color: '#003DA5', fontSize: 11, fontWeight: '600' },
  pillAlt: { backgroundColor: '#E8F5E9' },
  pillAltText: { color: '#1B5E20', fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', color: '#0F1B36', marginBottom: 4 },
  company: { fontSize: 13, color: '#6B7589', fontWeight: '500', marginBottom: 8 },
  salary: { fontSize: 14, fontWeight: '700', color: '#003DA5', marginTop: 4 },
});
