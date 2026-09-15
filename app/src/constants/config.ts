import Constants from 'expo-constants';

/**
 * Lee la URL base de la API.
 * Prioridad: process.env (en dev via .env) > expo-constants extra.
 * NUNCA hardcodear.
 */
export const API_BASE_URL: string =
  process.env.API_BASE_URL ||
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  'http://localhost:3000';
