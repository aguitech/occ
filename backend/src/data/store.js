/**
 * Store en memoria.
 * Sobrevive a requests, muere al reiniciar el server (aceptable por spec).
 */

import { buildJobs } from '../seed/jobs.js';

export const store = {
  // Usuario mock único
  user: {
    id: 'user_001',
    email: 'test@occ.com.mx',
    password: 'Test1234',
    name: 'Candidato OCC',
  },

  // 90 vacantes generadas al arrancar
  jobs: buildJobs(90),

  // Aplicaciones del usuario: Map<userId, Set<jobId>>
  applications: new Map([['user_001', new Set()]]),

  // Favoritos del usuario: Map<userId, Set<jobId>>
  favorites: new Map([['user_001', new Set()]]),

  // JWT blacklist: Set<token>
  tokenBlacklist: new Set(),
};
