import axios, { AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('foodeez_restaurant_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';

    // Show toast for errors (except for 401 which is handled by auth store)
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('foodeez_restaurant_token');
        localStorage.removeItem('foodeez_restaurant_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  token: string;
}

// Restaurant Profile Types
export interface RestaurantProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  cuisineType: string[];
  imageUrl?: string;
  rating: number;
  ratingCount: number;
  avgDeliveryTime: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  isActive: boolean;
  isAvailableNow: boolean;
  subscriptionFeeWaived: boolean;
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  wallet?: {
    id: string;
    balance: number;
    pendingAmount: number;
  };
}

// Menu Item Types
export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  isVeg: boolean;
  preparationTime: number;
  spiceLevel: 'none' | 'low' | 'medium' | 'high';
  allergens: string[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string;
  status: 'pending' | 'restaurant_accepted' | 'preparing' | 'ready_for_pickup' | 'driver_assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled_by_customer' | 'cancelled_by_restaurant' | 'cancelled_by_admin';
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount?: number;
  tipAmount?: number;
  specialInstructions?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  restaurantAcceptedAt?: Date;
  preparationStartedAt?: Date;
  readyForPickupAt?: Date;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  deliveryPartner?: {
    id: string;
    user: {
      name: string;
      phone: string;
    };
    vehicleNumber: string;
    vehicleType: string;
    rating: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  menuItem?: MenuItem;
}

// Review Types
export interface Review {
  id: string;
  customerId: string;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  customer: {
    name: string;
  };
}

// Analytics Types
export interface RestaurantAnalytics {
  overview: {
    totalOrders: number;
    revenue: number;
    avgOrderValue: number;
    customerCount: number;
    menuItemsCount: number;
    activeItemsCount: number;
  };
  orderStats: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  recentOrders: Order[];
  topSellingItems: Array<{
    menuItemId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  customerTrends: {
    todayOrders: number;
    weeklyOrders: number;
    monthlyOrders: number;
  };
}

// Wallet Types
export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  transactionType: 'credit' | 'debit' | 'refund' | 'payout' | 'adjustment' | 'commission' | 'subscription' | 'compensation' | 'deduction';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  metadata?: any;
}

// API Functions

// Auth APIs
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/restaurant/login', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Restaurant Profile APIs
export const restaurantAPI = {
  getProfile: async (): Promise<ApiResponse<RestaurantProfile>> => {
    const response = await api.get('/restaurant/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<RestaurantProfile>): Promise<ApiResponse<RestaurantProfile>> => {
    const response = await api.put('/restaurant/profile', data);
    return response.data;
  },

  updateOperatingHours: async (operatingHours: RestaurantProfile['operatingHours']): Promise<ApiResponse> => {
    const response = await api.put('/restaurant/operating-hours', { operatingHours });
    return response.data;
  },

  toggleAvailability: async (): Promise<ApiResponse<{ isAvailableNow: boolean }>> => {
    const response = await api.put('/restaurant/toggle-availability');
    return response.data;
  },

  getAnalytics: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<RestaurantAnalytics>> => {
    const response = await api.get('/restaurant/analytics', { params });
    return response.data;
  },

  getSubscriptionStatus: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/restaurant/subscription');
    return response.data;
  },
};

// Menu APIs
export const menuAPI = {
  getMenuItems: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    isAvailable?: boolean;
  }): Promise<ApiResponse<MenuItem[]>> => {
    const response = await api.get('/restaurant/menu', { params });
    return response.data;
  },

  createMenuItem: async (data: Omit<MenuItem, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MenuItem>> => {
    const response = await api.post('/restaurant/menu', data);
    return response.data;
  },

  updateMenuItem: async (id: string, data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> => {
    const response = await api.put(`/restaurant/menu/${id}`, data);
    return response.data;
  },

  deleteMenuItem: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/restaurant/menu/${id}`);
    return response.data;
  },

  updateMenuItemAvailability: async (id: string, isAvailable: boolean): Promise<ApiResponse<MenuItem>> => {
    const response = await api.put(`/restaurant/menu/${id}/availability`, { isAvailable });
    return response.data;
  },

  bulkUpdateAvailability: async (updates: Array<{ id: string; isAvailable: boolean }>): Promise<ApiResponse> => {
    const response = await api.put('/restaurant/menu/bulk-availability', { updates });
    return response.data;
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/restaurant/menu/categories');
    return response.data;
  },
};

// Order Management APIs
export const orderAPI = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/restaurant/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/restaurant/orders/${id}`);
    return response.data;
  },

  acceptOrder: async (id: string, estimatedPrepTime: number): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/restaurant/orders/${id}/accept`, { estimatedPrepTime });
    return response.data;
  },

  rejectOrder: async (id: string, reason: string): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/restaurant/orders/${id}/reject`, { reason });
    return response.data;
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/restaurant/orders/${id}/status`, { status });
    return response.data;
  },

  markAsReady: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/restaurant/orders/${id}/ready`);
    return response.data;
  },

  getOrderStats: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/restaurant/orders/stats', { params });
    return response.data;
  },
};

// Reviews APIs
export const reviewAPI = {
  getReviews: async (params?: {
    page?: number;
    limit?: number;
    rating?: number;
  }): Promise<ApiResponse<Review[]>> => {
    const response = await api.get('/restaurant/reviews', { params });
    return response.data;
  },

  getReviewStats: async (): Promise<ApiResponse<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }>> => {
    const response = await api.get('/restaurant/reviews/stats');
    return response.data;
  },

  replyToReview: async (id: string, reply: string): Promise<ApiResponse<Review>> => {
    const response = await api.post(`/restaurant/reviews/${id}/reply`, { reply });
    return response.data;
  },
};

// Wallet APIs
export const walletAPI = {
  getWallet: async (): Promise<ApiResponse<RestaurantProfile['wallet']>> => {
    const response = await api.get('/restaurant/wallet');
    return response.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    transactionType?: string;
  }): Promise<ApiResponse<WalletTransaction[]>> => {
    const response = await api.get('/restaurant/wallet/transactions', { params });
    return response.data;
  },

  requestWithdrawal: async (amount: number, method: string, details: any): Promise<ApiResponse> => {
    const response = await api.post('/restaurant/wallet/withdraw', { amount, method, details });
    return response.data;
  },
};

export default api;