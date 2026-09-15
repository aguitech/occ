import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useJobsSearch, makeOnEndReached, sortLabel } from '../../hooks/useJobsSearch';
import { CITIES, SORT_OPTIONS, type SortOption } from '../../types/api';
import type { Job } from '../../types/api';
import JobCard from '../../components/JobCard';
import { useRouter } from 'expo-router';

export default function JobSearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [city, setCity] = useState<string | undefined>();
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('date_desc');

  const query = {
    q: q || undefined,
    city,
    salary_min: salaryMin ? Number(salaryMin) : undefined,
    salary_max: salaryMax ? Number(salaryMax) : undefined,
    sort,
    limit: 20,
  };

  const { jobs, loading, refreshing, error, hasNext, total, loadMore, refresh } = useJobsSearch(query);

  const onEndReached = makeOnEndReached(loadMore, hasNext, jobs.length);

  const onPressJob = (job: Job) => {
    router.push({ pathname: '/job/[id]', params: { id: job.id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar vacante o empresa"
          placeholderTextColor="#999"
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filtersRow}>
        <ScrollableChips
          options={CITIES as unknown as string[]}
          value={city}
          onChange={setCity}
          placeholder="Ciudad"
        />
      </View>

      <View style={styles.filtersRow}>
        <TextInput
          style={styles.salaryInput}
          placeholder="Salario mín"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={salaryMin}
          onChangeText={setSalaryMin}
        />
        <TextInput
          style={styles.salaryInput}
          placeholder="Salario máx"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={salaryMax}
          onChangeText={setSalaryMax}
        />
      </View>

      <View style={styles.filtersRow}>
        <ScrollableChips
          options={SORT_OPTIONS as unknown as string[]}
          value={sort}
          onChange={(v) => setSort(v as SortOption)}
          placeholder="Orden"
          labelFn={(v) => sortLabel(v as SortOption)}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{total} vacantes</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <FlashList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} onPress={() => onPressJob(item)} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#003DA5" />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Cargando vacantes…</Text>
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No encontramos vacantes con esos filtros.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function ScrollableChips({
  options,
  value,
  onChange,
  placeholder,
  labelFn,
}: {
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder: string;
  labelFn?: (v: string) => string;
}) {
  return (
    <View style={styles.chipsRow}>
      <Chip active={!value} label={`Todos`} onPress={() => onChange(undefined)} />
      {options.map((opt) => (
        <Chip
          key={opt}
          active={value === opt}
          label={labelFn ? labelFn(opt) : opt}
          onPress={() => onChange(opt)}
        />
      ))}
    </View>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5fa' },
  searchBar: { padding: 12, backgroundColor: '#003DA5' },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e6efff',
  },
  chipActive: { backgroundColor: '#003DA5' },
  chipText: { color: '#003DA5', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  salaryInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  metaRow: { paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: '#607086' },
  errorText: { color: '#d94152', fontSize: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#607086', fontSize: 14 },
  retryBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#003DA5', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
});
