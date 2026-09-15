import { Router } from 'express';
import { ok, fail, ERR } from '../utils/envelope.js';
import { store } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// POST /jobs/:id/apply — registra aplicación
router.post('/:id/apply', authRequired, (req, res) => {
  const job = store.jobs.find((j) => j.id === req.params.id);
  if (!job) return fail(res, 404, ERR.NOT_FOUND, 'Vacante no encontrada');

  const userApps = store.applications.get(req.user.id) ?? new Set();
  if (userApps.has(job.id)) {
    return fail(res, 409, ERR.ALREADY_APPLIED, 'Ya aplicaste a esta vacante');
  }
  userApps.add(job.id);
  store.applications.set(req.user.id, userApps);
  return ok(res, { jobId: job.id, applied: true });
});

// DELETE /jobs/:id/apply — cancela aplicación
router.delete('/:id/apply', authRequired, (req, res) => {
  const userApps = store.applications.get(req.user.id);
  if (!userApps || !userApps.has(req.params.id)) {
    return fail(res, 404, ERR.NOT_FOUND, 'No has aplicado a esta vacante');
  }
  userApps.delete(req.params.id);
  return ok(res, { jobId: req.params.id, applied: false });
});

// GET /applications — lista de aplicaciones del usuario
router.get('/', authRequired, (req, res) => {
  const userApps = store.applications.get(req.user.id) ?? new Set();
  const items = store.jobs.filter((j) => userApps.has(j.id));
  return ok(res, { items, total: items.length });
});

export default router;
