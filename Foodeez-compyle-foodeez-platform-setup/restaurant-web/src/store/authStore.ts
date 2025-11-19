import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });

          const response = await authAPI.login({ email, password });

          if (response.success && response.data) {
            const { user, token } = response.data;

            // Store token in localStorage for axios interceptor
            localStorage.setItem('foodeez_restaurant_token', token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success(`Welcome back, ${user.name}!`);
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Call logout API (but don't wait for it)
        authAPI.logout().catch(console.error);

        // Clear localStorage
        localStorage.removeItem('foodeez_restaurant_token');
        localStorage.removeItem('foodeez_restaurant_user');

        // Clear store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });

        toast.success('Logged out successfully');
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true });

          const response = await authAPI.changePassword(currentPassword, newPassword);

          if (response.success) {
            toast.success('Password changed successfully!');
          } else {
            throw new Error(response.message || 'Password change failed');
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
        }
      },

      checkAuth: () => {
        const { token, user } = get();

        if (!token || !user) {
          return false;
        }

        // Additional validation if needed
        return user.isActive && (user.role === 'restaurant');
      },
    }),
    {
      name: 'foodeez-restaurant-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state from localStorage
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('foodeez_restaurant_token');
    const userData = localStorage.getItem('foodeez_restaurant_user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        useAuthStore.setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // Clear invalid data
        localStorage.removeItem('foodeez_restaurant_token');
        localStorage.removeItem('foodeez_restaurant_user');
      }
    }
  }
};