import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { fail, ERR } from './utils/envelope.js';

import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import {
  applyRouter,
  favoriteRouter,
  listApplications,
  listFavorites,
} from './routes/actions.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: config.corsOrigin }));

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true, data: { status: 'ok' } }));

// Rutas
app.use('/auth', authRoutes);

// Jobs: prefijo /jobs, dentro se manejan /jobs, /jobs/:id
app.use('/jobs', jobsRoutes);
// Sub-recursos con :id
app.use('/jobs/:id/apply', applyRouter);
app.use('/jobs/:id/favorite', favoriteRouter);

// Listas por usuario
app.use('/applications', listApplications);
app.use('/favorites', listFavorites);

// 404
app.use((req, res) => fail(res, 404, ERR.NOT_FOUND, 'Endpoint no encontrado'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (err.type === 'entity.parse.failed') {
    return fail(res, 422, ERR.VALIDATION_ERROR, 'JSON inválido');
  }
  return fail(res, 500, ERR.INTERNAL, 'Error interno del servidor');
});

app.listen(config.port, () => {
  console.log(`✓ OCC Backend · http://localhost:${config.port}`);
  console.log(`  · JWT expires in ${config.jwtExpiresIn}`);
  console.log(`  · 90 vacantes en memoria`);
});
