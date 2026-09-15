import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock AsyncStorage para que Zustand persist no falle en Node
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(async () => {}),
    getItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => {}),
  },
}));

import { useSessionStore } from '../store/session';

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.setState({ token: null, user: null, hydrated: false });
  });

  it('starts without session', () => {
    const state = useSessionStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setSession stores token + user', () => {
    useSessionStore.getState().setSession('tok-123', {
      id: 'u1',
      email: 'test@occ.com.mx',
      name: 'Candidato',
    });
    const s = useSessionStore.getState();
    expect(s.token).toBe('tok-123');
    expect(s.user?.email).toBe('test@occ.com.mx');
  });

  it('clearSession resets token + user', () => {
    useSessionStore.getState().setSession('tok', { id: 'u1', email: 'a@b.c', name: 'X' });
    useSessionStore.getState().clearSession();
    const s = useSessionStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
  });

  it('validateToken returns false si no hay token', async () => {
    const ok = await useSessionStore.getState().validateToken();
    expect(ok).toBe(false);
  });
});
