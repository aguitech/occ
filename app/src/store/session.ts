import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/modules';

/**
 * Store de sesión con Zustand + persistencia en AsyncStorage.
 * Token y user se persisten para sobrevivir cierres de app.
 * Al iniciar la app, se hidrata desde AsyncStorage y se valida con /auth/me.
 */

type SessionState = {
  token: string | null;
  user: { id: string; email: string; name: string } | null;
  hydrated: boolean;
  setSession: (token: string, user: { id: string; email: string; name: string }) => void;
  setUser: (user: { id: string; email: string; name: string }) => void;
  clearSession: () => void;
  setHydrated: (val: boolean) => void;
  validateToken: () => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,

      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ token: null, user: null }),
      setHydrated: (val) => set({ hydrated: val }),

      /**
       * Valida el token con /auth/me. Retorna true si sigue vigente.
       * Si falla (401, expirado), limpia la sesión.
       */
      validateToken: async () => {
        const { token } = get();
        if (!token) return false;
        try {
          const user = await authService.me();
          set({ user });
          return true;
        } catch {
          set({ token: null, user: null });
          return false;
        }
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          try { await authService.logout(); } catch { /* ignorar error de red */ }
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: 'occ-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
