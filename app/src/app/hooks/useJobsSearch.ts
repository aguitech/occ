import { useEffect, useRef, useState, useCallback } from 'react';
import { jobsService } from '../services/modules';
import type { Job } from '../types/api';

export type JobsQuery = {
  q?: string;
  city?: string;
  modality?: 'remote' | 'hybrid' | 'onsite';
  salary_min?: number;
  salary_max?: number;
  sort?: 'date_desc' | 'date_asc' | 'salary_desc' | 'salary_asc' | 'relevance';
  limit?: number;
  cursor?: string;
};

export type JobsSearchState = {
  jobs: Job[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasNext: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useJobsSearch(query: JobsQuery): JobsSearchState {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const cursorRef = useRef<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aborterRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (reset: boolean, q: JobsQuery) => {
      try {
        if (reset) {
          cursorRef.current = undefined;
          setError(null);
        }
        const result = await jobsService.list({
          ...q,
          cursor: reset ? undefined : cursorRef.current,
          signal: aborterRef.current?.signal,
        });
        const newJobs: Job[] = result.items ?? [];
        setJobs((prev) => (reset ? newJobs : [...prev, ...newJobs]));
        cursorRef.current = result.nextCursor;
        setHasNext(Boolean(result.nextCursor));
        setTotal(result.total ?? newJobs.length);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Error al cargar vacantes');
        }
      }
    },
    [],
  );

  // Recargar cuando cambia el query (con debounce para el texto)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    aborterRef.current?.abort();
    aborterRef.current = new AbortController();

    setLoading(true);
    const delay = query.q ? 350 : 0;
    debounceRef.current = setTimeout(async () => {
      await fetchPage(true, query);
      setLoading(false);
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      aborterRef.current?.abort();
    };
  }, [
    query.q, query.city, query.modality,
    query.salary_min, query.salary_max, query.sort,
    fetchPage,
  ]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading) return;
    setLoading(true);
    await fetchPage(false, query);
    setLoading(false);
  }, [fetchPage, hasNext, loading, query]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(true, query);
    setRefreshing(false);
  }, [fetchPage, query]);

  return { jobs, loading, refreshing, error, hasNext, total, loadMore, refresh };
}

export function makeOnEndReached(
  loadMore: () => Promise<void>,
  hasNext: boolean,
  currentCount: number,
) {
  return () => {
    // Prefetch cuando quedan <10 visibles
    if (hasNext && currentCount > 0) loadMore();
  };
}

export function sortLabel(s: string): string {
  const map: Record<string, string> = {
    date_desc: 'Más recientes',
    date_asc: 'Más antiguas',
    salary_desc: 'Mejor sueldo',
    salary_asc: 'Sueldo más bajo',
    relevance: 'Relevancia',
  };
  return map[s] ?? s;
}
