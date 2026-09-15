import { Router } from 'express';
import { ok, fail, ERR } from '../utils/envelope.js';
import { store } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// POST /jobs/:id/favorite — agrega a favoritos
router.post('/:id/favorite', authRequired, (req, res) => {
  const job = store.jobs.find((j) => j.id === req.params.id);
  if (!job) return fail(res, 404, ERR.NOT_FOUND, 'Vacante no encontrada');

  const userFavs = store.favorites.get(req.user.id) ?? new Set();
  if (userFavs.has(job.id)) {
    return fail(res, 409, ERR.ALREADY_FAVORITED, 'Ya está en favoritos');
  }
  userFavs.add(job.id);
  store.favorites.set(req.user.id, userFavs);
  return ok(res, { jobId: job.id, favorited: true });
});

// DELETE /jobs/:id/favorite — elimina de favoritos
router.delete('/:id/favorite', authRequired, (req, res) => {
  const userFavs = store.favorites.get(req.user.id);
  if (!userFavs || !userFavs.has(req.params.id)) {
    return fail(res, 404, ERR.NOT_FOUND, 'No está en favoritos');
  }
  userFavs.delete(req.params.id);
  return ok(res, { jobId: req.params.id, favorited: false });
});

// GET /favorites — lista de favoritos del usuario
router.get('/', authRequired, (req, res) => {
  const userFavs = store.favorites.get(req.user.id) ?? new Set();
  const items = store.jobs.filter((j) => userFavs.has(j.id));
  return ok(res, { items, total: items.length });
});

export default router;
