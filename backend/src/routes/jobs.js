import { Router } from 'express';
import { z } from 'zod';
import { ok, fail, ERR } from '../utils/envelope.js';
import { store } from '../data/store.js';

const router = Router();

const querySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  sort: z.enum(['date_desc', 'date_asc', 'salary_desc', 'salary_asc', 'relevance']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

function sortJobs(jobs, sort) {
  const arr = [...jobs];
  switch (sort) {
    case 'date_asc':
      return arr.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    case 'salary_desc':
      return arr.sort((a, b) => (b.salary ?? -1) - (a.salary ?? -1));
    case 'salary_asc':
      return arr.sort((a, b) => (a.salary ?? Infinity) - (b.salary ?? Infinity));
    case 'relevance':
    default:
      return arr; // orden de relevancia: orden original estable
    case 'date_desc':
      return arr.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }
}

// GET /jobs — lista paginada
router.get('/', (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return fail(res, 422, ERR.VALIDATION_ERROR, 'Parámetros inválidos', {
      issues: parsed.error.issues,
    });
  }
  const { q, city, salary_min, salary_max, sort, page, limit } = parsed.data;

  let filtered = store.jobs;

  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (j) => j.title.toLowerCase().includes(needle) || j.company.toLowerCase().includes(needle)
    );
  }
  if (city) {
    filtered = filtered.filter((j) => j.city === city);
  }
  if (salary_min != null || salary_max != null) {
    filtered = filtered.filter((j) => j.salary != null);
    if (salary_min != null) filtered = filtered.filter((j) => j.salary >= salary_min);
    if (salary_max != null) filtered = filtered.filter((j) => j.salary <= salary_max);
  }

  const sorted = sortJobs(filtered, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const data = sorted.slice(offset, offset + limit);

  return ok(res, {
    items: data,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages },
  });
});

// GET /jobs/:id — detalle
router.get('/:id', (req, res) => {
  const job = store.jobs.find((j) => j.id === req.params.id);
  if (!job) return fail(res, 404, ERR.NOT_FOUND, 'Vacante no encontrada');
  return ok(res, job);
});

export default router;
