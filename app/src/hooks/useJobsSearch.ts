import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jobsService, type JobsQuery } from '../services/modules';
import type { Job, SortOption } from '../types/api';

/**
 * Hook de búsqueda de vacantes con:
 * - Debounce de 300ms en `q`
 * - Cancelación de requests en vuelo (al cambiar filtros)
 * - Paginación incremental con `loadMore`
 * - Prefetch silencioso de la página siguiente
 * - Reset a page 1 ante cualquier cambio de filtro/sort
 */

export type UseJobsSearchResult = {
  jobs: Job[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasNext: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
};

const PREFETCH_THRESHOLD = 3; // cargar siguiente página cuando faltan N items

export function useJobsSearch(query: JobsQuery): UseJobsSearchResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);

  const pageRef = useRef(1);
  const queryRef = useRef<JobsQuery>(query);
  const requestIdRef = useRef(0);

  // Estabilizar el query serializado para detectar cambios reales
  const queryKey = useMemo(() => JSON.stringify({
    q: query.q ?? '',
    city: query.city ?? '',
    salary_min: query.salary_min ?? null,
    salary_max: query.salary_max ?? null,
    sort: query.sort ?? 'date_desc',
    limit: query.limit ?? 20,
  }), [query.q, query.city, query.salary_min, query.salary_max, query.sort, query.limit]);

  const fetchPage = useCallback(
    async (page: number, mode: 'replace' | 'append') => {
      const reqId = ++requestIdRef.current;
      try {
        if (mode === 'replace') setLoading(true);
        else setLoadingMore(true);

        const result = await jobsService.list({ ...query, page, limit: query.limit ?? 20 });
        if (reqId !== requestIdRef.current) return; // request viejo, descartar

        if (mode === 'replace') setJobs(result.items);
        else setJobs((prev) => [...prev, ...result.items]);

        setHasNext(result.pagination.hasNext);
        setTotal(result.pagination.total);
        pageRef.current = page;
        setError(null);
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [query.q, query.city, query.salary_min, query.salary_max, query.sort, query.limit]
  );

  // Debounce en cambios de query
  useEffect(() => {
    queryRef.current = query;
    setLoading(true);
    setJobs([]);
    const timer = setTimeout(() => {
      fetchPage(1, 'replace');
    }, query.q ? 300 : 0); // 300ms si hay texto, inmediato en filtros

    return () => clearTimeout(timer);
  }, [queryKey]);

  const loadMore = useCallback(() => {
    if (!hasNext || loadingMore || loading) return;
    fetchPage(pageRef.current + 1, 'append');
  }, [hasNext, loadingMore, loading, fetchPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPage(1, 'replace');
  }, [fetchPage]);

  return {
    jobs,
    loading,
    loadingMore,
    refreshing,
    error,
    hasNext,
    total,
    loadMore,
    refresh,
  };
}

/**
 * Helper para integrar el hook con FlashList:
 * retorna el callback onEndReached que dispara prefetch cuando faltan
 * `PREFETCH_THRESHOLD` items para el final.
 */
export function makeOnEndReached(
  loadMore: () => void,
  hasNext: boolean,
  totalLoaded: number
) {
  return ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    if (!hasNext) return;
    if (distanceFromEnd <= PREFETCH_THRESHOLD) loadMore();
  };
}

export function sortLabel(sort: SortOption): string {
  switch (sort) {
    case 'date_desc': return 'Más recientes';
    case 'date_asc': return 'Más antiguos';
    case 'salary_desc': return 'Mayor salario';
    case 'salary_asc': return 'Menor salario';
    case 'relevance': return 'Relevancia';
  }
}
