/**
 * Configuración runtime de la app.
 * Lee API_BASE_URL de process.env (Expo) y exporta como string.
 */

const fromEnv =
  // variables distintas según el runner
  (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL)) ||
  '';

export const API_BASE_URL: string = fromEnv || 'http://localhost:3000';

export const APP_NAME = 'OCC Mobile';
export const APP_SCHEME = 'occ';
