import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ok, fail, ERR } from '../utils/envelope.js';
import { config } from '../config.js';
import { store } from '../data/store.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /auth/login
router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 422, ERR.VALIDATION_ERROR, 'Email o password inválidos', {
      issues: parsed.error.issues,
    });
  }
  const { email, password } = parsed.data;
  if (email !== store.user.email || password !== store.user.password) {
    return fail(res, 401, ERR.INVALID_CREDENTIALS, 'Credenciales inválidas');
  }
  const token = jwt.sign(
    { sub: store.user.id, email: store.user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  return ok(res, {
    token,
    user: { id: store.user.id, email: store.user.email, name: store.user.name },
  });
});

// POST /auth/logout — invalida el token
router.post('/logout', authRequired, (req, res) => {
  store.tokenBlacklist.add(req.token);
  return ok(res, { invalidated: true });
});

// GET /auth/me — valida el token y devuelve el usuario
router.get('/me', authRequired, (req, res) => {
  return ok(res, {
    id: store.user.id,
    email: store.user.email,
    name: store.user.name,
  });
});

export default router;
