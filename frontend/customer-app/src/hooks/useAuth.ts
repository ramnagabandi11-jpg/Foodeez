import { useContext, createContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/api/auth';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        // Token might be invalid, clear it
        localStorage.removeItem('accessToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success && response.data) {
        const { user: userData, accessToken } = response.data;

        // Store token
        localStorage.setItem('accessToken', accessToken);
        setUser(userData);

        toast.success('Welcome back!');
        router.push('/');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);

      if (response.success) {
        toast.success('Registration successful! Please verify your email.');
        router.push('/login');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(userData);

      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await authAPI.resetPassword({ email });

      if (response.success) {
        toast.success('Password reset email sent!');
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}