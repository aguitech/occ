/**
 * Envelope estándar de respuesta (éxito/error).
 * Cumple contrato OCC: { ok, data } o { ok:false, error:{code,message} }
 */

export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function fail(res, status, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    error: { code, message, ...extra },
  });
}

// Códigos de error documentados
export const ERR = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_APPLIED: 'ALREADY_APPLIED',
  ALREADY_FAVORITED: 'ALREADY_FAVORITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL: 'INTERNAL',
};
