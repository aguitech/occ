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

/**
 * Hidrata la sesión desde localStorage en web.
 * En React Native el AsyncStorage nativo se hidrata solo;
 * en web Zustand persist necesita empujar manualmente porque
 * AsyncStorage RN no tiene build web.
 */
export function hydrateFromWebStorage() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem('occ-session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state?.token && state?.user) {
        useSessionStore.getState().setSession(state.token, state.user);
      }
    }
  } catch {
    // ignore malformed storage
  } finally {
    useSessionStore.getState().setHydrated(true);
  }
}
