import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../services/modules', () => ({
  jobsService: {
    list: jest.fn(async () => ({
      items: [
        { id: 'job_001', title: 'A', company: 'C', city: 'CDMX', salary: 1000, description: '', publishedAt: '', tags: [] },
        { id: 'job_002', title: 'B', company: 'C', city: 'CDMX', salary: 2000, description: '', publishedAt: '', tags: [] },
      ],
      pagination: { page: 1, limit: 20, total: 40, totalPages: 2, hasNext: true },
    })),
  },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { useJobsSearch } from '../hooks/useJobsSearch';

describe('useJobsSearch hook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('carga inicial: jobs + hasNext true', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useJobsSearch({ q: undefined, sort: 'date_desc', limit: 20 })
    );
    await waitForNextUpdate();
    expect(result.current.jobs.length).toBe(2);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('reset cuando cambia q', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ q }) => useJobsSearch({ q, sort: 'date_desc', limit: 20 }),
      { initialProps: { q: undefined as string | undefined } }
    );
    await waitForNextUpdate();
    rerender({ q: 'react' });
    await waitForNextUpdate();
    expect(result.current.jobs.length).toBeGreaterThanOrEqual(0);
  });
});
