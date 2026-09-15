import { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Job } from '../types/api';

type Props = {
  job: Job;
  onPress: () => void;
};

function formatSalary(s: number | null): string {
  if (s == null) return 'Salario no mostrado';
  return `$${s.toLocaleString('es-MX')}/mes`;
}

function JobCard({ job, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      </View>
      <Text style={styles.company}>{job.company}</Text>
      <View style={styles.meta}>
        <Text style={styles.city}>📍 {job.city}</Text>
        <Text style={styles.salary}>{formatSalary(job.salary)}</Text>
      </View>
      <View style={styles.tags}>
        {job.tags.slice(0, 3).map((t) => (
          <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default memo(JobCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '800', color: '#132238', flex: 1, paddingRight: 8 },
  company: { fontSize: 13, color: '#003DA5', marginTop: 4, fontWeight: '600' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  city: { fontSize: 12, color: '#607086' },
  salary: { fontSize: 12, color: '#18a965', fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#e6efff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#003DA5', fontWeight: '600' },
});
