import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  role: 'candidate' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  register: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      register: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      loadFromStorage: () => {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.state?.user && parsed.state?.token) {
              set({
                user: parsed.state.user,
                token: parsed.state.token,
                isAuthenticated: true,
              });
            }
          } catch (e) {
            console.error('Failed to load auth from storage', e);
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);