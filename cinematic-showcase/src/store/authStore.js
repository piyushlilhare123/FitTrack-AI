import { create } from 'zustand';
import api from '../lib/api';

const authStoreCreator = (set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('fittrack_token') : null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setLoading: (loading) => set({ isLoading: loading }),

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }
    try {
      set({ isLoading: true });
      const res = await api.get('/api/auth/me');
      set({ user: res.data, isAuthenticated: true, error: null });
    } catch (err) {
      console.error('CheckAuth failed, logging out:', err.response?.data?.message || err.message);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fittrack_token');
      }
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, extraData = {}) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/api/auth/register', { name, email, password, ...extraData });
      
      const { token, ...userData } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fittrack_token', token);
      }
      set({ user: userData, token, isAuthenticated: true, hasShownSundayModal: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/api/auth/login', { email, password });

      const { token, ...userData } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fittrack_token', token);
      }
      set({ user: userData, token, isAuthenticated: true, hasShownSundayModal: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/api/auth/reset-password', { email, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Password reset failed';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fittrack_token');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  updateUser: async (updateData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.put('/api/auth/me', updateData);
      
      const { token, ...userData } = res.data;
      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fittrack_token', token);
        }
        set({ user: userData, token });
      } else {
        set({ user: userData });
      }
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ isLoading: false });
    }
  },
});

export const useAuthStore = create(authStoreCreator);
export default useAuthStore;
