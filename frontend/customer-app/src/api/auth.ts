import axios from 'axios';
import type { User, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post<ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>>('/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await apiClient.post<ApiResponse>('/auth/register', userData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  // Update profile
  updateProfile: async (userData: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await apiClient.post<ApiResponse>('/auth/change-password', passwords);
    return response.data;
  },

  // Reset password
  resetPassword: async (email: { email: string }) => {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', email);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (data: { email: string; otp: string }) => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/verify-otp', data);
    return response.data;
  },

  // Send OTP
  sendOTP: async (email: { email: string }) => {
    const response = await apiClient.post<ApiResponse>('/auth/send-otp', email);
    return response.data;
  },
};

export default apiClient;