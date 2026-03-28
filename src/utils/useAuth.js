import { create } from 'zustand';

// Persistent auth store using localStorage
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('qtrade_token') || null,
  isAuthenticated: !!localStorage.getItem('qtrade_token'),

  setAuth: (user, token) => {
    localStorage.setItem('qtrade_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('qtrade_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
