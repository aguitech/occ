import { Router } from 'express';
import { ok, fail, ERR } from '../utils/envelope.js';
import { store } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';

// Sub-router para /jobs/:id/apply
const applyRouter = Router({ mergeParams: true });
applyRouter.post('/', authRequired, (req, res) => {
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

applyRouter.delete('/', authRequired, (req, res) => {
  const userApps = store.applications.get(req.user.id);
  if (!userApps || !userApps.has(req.params.id)) {
    return fail(res, 404, ERR.NOT_FOUND, 'No has aplicado a esta vacante');
  }
  userApps.delete(req.params.id);
  return ok(res, { jobId: req.params.id, applied: false });
});

// Sub-router para /jobs/:id/favorite
const favoriteRouter = Router({ mergeParams: true });
favoriteRouter.post('/', authRequired, (req, res) => {
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

favoriteRouter.delete('/', authRequired, (req, res) => {
  const userFavs = store.favorites.get(req.user.id);
  if (!userFavs || !userFavs.has(req.params.id)) {
    return fail(res, 404, ERR.NOT_FOUND, 'No está en favoritos');
  }
  userFavs.delete(req.params.id);
  return ok(res, { jobId: req.params.id, favorited: false });
});

// GET /applications — lista de aplicaciones del usuario
const listApplications = Router();
listApplications.get('/', authRequired, (req, res) => {
  const userApps = store.applications.get(req.user.id) ?? new Set();
  const items = store.jobs.filter((j) => userApps.has(j.id));
  return ok(res, { items, total: items.length });
});

// GET /favorites — lista de favoritos
const listFavorites = Router();
listFavorites.get('/', authRequired, (req, res) => {
  const userFavs = store.favorites.get(req.user.id) ?? new Set();
  const items = store.jobs.filter((j) => userFavs.has(j.id));
  return ok(res, { items, total: items.length });
});

export { applyRouter, favoriteRouter, listApplications, listFavorites };
