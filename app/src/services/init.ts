import { configureApi } from './api';
import { useSessionStore } from '../store/session';

/**
 * Inicializa el interceptor de api.ts leyendo el token actual del store.
 * Llamar una sola vez en el root del árbol.
 */
export function initApi() {
  configureApi({
    getToken: () => useSessionStore.getState().token,
    onUnauthorized: () => {
      useSessionStore.getState().clearSession();
    },
  });
}
