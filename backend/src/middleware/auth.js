import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { fail, ERR } from '../utils/envelope.js';

/**
 * Verifica JWT del header Authorization: "Bearer <token>".
 * Si el token está en la blacklist (logout), retorna 401.
 * Si está expirado, retorna 401 con code=TOKEN_EXPIRED.
 */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return fail(res, 401, ERR.AUTH_REQUIRED, 'Token no proporcionado');
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (req.tokenBlacklist?.has(token)) {
      return fail(res, 401, ERR.AUTH_REQUIRED, 'Token invalidado');
    }
    req.user = { id: payload.sub, email: payload.email };
    req.token = token;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 401, ERR.TOKEN_EXPIRED, 'Token expirado');
    }
    return fail(res, 401, ERR.AUTH_REQUIRED, 'Token inválido');
  }
}
