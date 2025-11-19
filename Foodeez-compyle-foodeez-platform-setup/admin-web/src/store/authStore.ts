import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'manager' | 'support' | 'area_manager' | 'team_lead' | 'finance' | 'hr';
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
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => boolean;
  hasPermission: (requiredRole: User['role']) => boolean;
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
            localStorage.setItem('foodeez_admin_token', token);

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
        localStorage.removeItem('foodeez_admin_token');
        localStorage.removeItem('foodeez_admin_user');

        // Clear store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });

        toast.success('Logged out successfully');
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
        return user.isActive && ['super_admin', 'manager', 'support', 'area_manager', 'team_lead', 'finance', 'hr'].includes(user.role);
      },

      hasPermission: (requiredRole: User['role']) => {
        const { user } = get();

        if (!user || !user.isActive) {
          return false;
        }

        // Role hierarchy for permissions
        const roleHierarchy = {
          super_admin: 7,
          manager: 6,
          finance: 5,
          hr: 5,
          area_manager: 4,
          team_lead: 3,
          support: 2,
        };

        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
      },
    }),
    {
      name: 'foodeez-admin-auth-storage',
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
    const token = localStorage.getItem('foodeez_admin_token');
    const userData = localStorage.getItem('foodeez_admin_user');

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
        localStorage.removeItem('foodeez_admin_token');
        localStorage.removeItem('foodeez_admin_user');
      }
    }
  }
};