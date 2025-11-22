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
      const token = localStorage.getItem('foodeez_token');
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
        localStorage.removeItem('foodeez_token');
        localStorage.removeItem('foodeez_user');
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

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
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

// Customer Types
export interface CustomerProfile {
  id: string;
  userId: string;
  totalOrders: number;
  loyaltyPoints: number;
  customerTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  addresses: Address[];
  wallet: {
    id: string;
    balance: number;
    pendingAmount: number;
  };
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string[];
  imageUrl: string;
  rating: number;
  ratingCount: number;
  avgDeliveryTime: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  isActive: boolean;
  isAvailableNow: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
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
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

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
  deliveryAddress: Address;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  restaurant?: Restaurant;
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

// Cart Types
export interface CartItem {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  menuItem: MenuItem;
}

export interface Cart {
  items: CartItem[];
  restaurant?: Restaurant;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
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
  restaurant?: Restaurant;
}

// API Functions

// Auth APIs
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/customer/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/customer/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Customer APIs
export const customerAPI = {
  getProfile: async (): Promise<ApiResponse<CustomerProfile>> => {
    const response = await api.get('/customer/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<CustomerProfile>): Promise<ApiResponse<CustomerProfile>> => {
    const response = await api.put('/customer/profile', data);
    return response.data;
  },

  getAddresses: async (): Promise<ApiResponse<Address[]>> => {
    const response = await api.get('/customer/addresses');
    return response.data;
  },

  addAddress: async (data: Omit<Address, 'id'>): Promise<ApiResponse<Address>> => {
    const response = await api.post('/customer/addresses', data);
    return response.data;
  },

  updateAddress: async (id: string, data: Partial<Address>): Promise<ApiResponse<Address>> => {
    const response = await api.put(`/customer/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/customer/addresses/${id}`);
    return response.data;
  },

  getWallet: async (): Promise<ApiResponse<CustomerProfile['wallet']>> => {
    const response = await api.get('/customer/wallet');
    return response.data;
  },

  getWalletTransactions: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/customer/wallet/transactions', { params });
    return response.data;
  },

  getLoyalty: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/customer/loyalty');
    return response.data;
  },

  getLoyaltyTransactions: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/customer/loyalty/transactions', { params });
    return response.data;
  },
};

// Restaurant APIs
export const restaurantAPI = {
  listRestaurants: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cuisineType?: string;
    sortBy?: 'rating' | 'deliveryTime' | 'deliveryFee';
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ApiResponse<Restaurant[]>> => {
    const response = await api.get('/restaurant/list', { params });
    return response.data;
  },

  getRestaurant: async (id: string): Promise<ApiResponse<Restaurant>> => {
    const response = await api.get(`/restaurant/${id}`);
    return response.data;
  },

  getRestaurantMenu: async (id: string): Promise<ApiResponse<MenuItem[]>> => {
    const response = await api.get(`/restaurant/${id}/menu`);
    return response.data;
  },

  searchRestaurants: async (query: string): Promise<ApiResponse<Restaurant[]>> => {
    const response = await api.get('/restaurant/search', { params: { q: query } });
    return response.data;
  },
};

// Order APIs
export const orderAPI = {
  createOrder: async (data: {
    restaurantId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    deliveryAddressId: string;
    specialInstructions?: string;
  }): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string, reason: string): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  trackOrder: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/orders/${id}/track`);
    return response.data;
  },
};

// Review APIs
export const reviewAPI = {
  getRestaurantReviews: async (restaurantId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
  }): Promise<ApiResponse<Review[]>> => {
    const response = await api.get(`/reviews/restaurant/${restaurantId}`, { params });
    return response.data;
  },

  submitReview: async (data: {
    orderId: string;
    rating: number;
    comment: string;
    images?: string[];
  }): Promise<ApiResponse<Review>> => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  updateReview: async (id: string, data: {
    rating?: number;
    comment?: string;
  }): Promise<ApiResponse<Review>> => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  deleteReview: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

// Payment APIs
export const paymentAPI = {
  createPaymentOrder: async (data: {
    orderId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/payment/create-order', data);
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/payment/verify', data);
    return response.data;
  },
};

export default api;