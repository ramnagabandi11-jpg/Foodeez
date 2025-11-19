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
      const token = localStorage.getItem('foodeez_admin_token');
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
        localStorage.removeItem('foodeez_admin_token');
        localStorage.removeItem('foodeez_admin_user');
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
    role: 'super_admin' | 'manager' | 'support' | 'area_manager' | 'team_lead' | 'finance' | 'hr';
    isActive: boolean;
    createdAt: string;
  };
  token: string;
}

// Restaurant Types
export interface Restaurant {
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
  createdAt: string;
}

// Customer Types
export interface Customer {
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
  wallet?: {
    id: string;
    balance: number;
    pendingAmount: number;
  };
}

// Delivery Partner Types
export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  isActive: boolean;
  isOnline: boolean;
  totalDeliveries: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  documents?: {
    licenseNumber?: string;
    insuranceNumber?: string;
    vehicleRegistration?: string;
    profilePhoto?: string;
    idProof?: string;
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
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  restaurant?: Restaurant;
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
}

// Analytics Types
export interface PlatformAnalytics {
  overview: {
    totalRestaurants: number;
    activeRestaurants: number;
    totalCustomers: number;
    totalDeliveryPartners: number;
    activeDeliveryPartners: number;
    totalOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalCommission: number;
    totalDeliveryFees: number;
  };
  orderStats: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    completionRate: number;
  };
  revenue: {
    totalRevenue: number;
    restaurantEarnings: number;
    platformEarnings: number;
    deliveryFees: number;
    commission: number;
    avgCtr: number;
  };
}

// HR Types
export interface Employee {
  id: string;
  userId: string;
  departmentId?: string;
  shiftId?: string;
  employeeCode: string;
  designation: string;
  joiningDate: Date;
  salary?: number;
  bankDetails?: any;
  documents?: any;
  isActive: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  department?: {
    id: string;
    name: string;
    description: string;
  };
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days: string[];
  };
}

export interface Department {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'sick' | 'casual' | 'earned';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  approvalComments?: string;
  employee?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

// Finance Types
export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  transactionType: 'credit' | 'debit' | 'refund' | 'payout' | 'adjustment' | 'commission' | 'subscription' | 'compensation' | 'deduction';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  metadata?: any;
  wallet?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

// API Functions

// Auth APIs
export const authAPI = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/admin/login', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Restaurant Management APIs
export const restaurantAPI = {
  getRestaurants: async (params?: {
    page?: number;
    limit?: number;
    status?: boolean;
    city?: string;
  }): Promise<ApiResponse<Restaurant[]>> => {
    const response = await api.get('/admin/restaurants', { params });
    return response.data;
  },

  getRestaurantDetails: async (id: string): Promise<ApiResponse<Restaurant>> => {
    const response = await api.get(`/admin/restaurants/${id}`);
    return response.data;
  },

  registerRestaurant: async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    description: string;
    cuisineType: string[];
    address: any;
    operatingHours: any;
  }): Promise<ApiResponse<Restaurant>> => {
    const response = await api.post('/admin/restaurants/register', data);
    return response.data;
  },

  updateRestaurant: async (id: string, data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> => {
    const response = await api.put(`/admin/restaurants/${id}`, data);
    return response.data;
  },

  updateRestaurantStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Restaurant>> => {
    const response = await api.put(`/admin/restaurants/${id}/status`, { isActive });
    return response.data;
  },

  waiveSubscriptionFee: async (id: string, waive: boolean): Promise<ApiResponse> => {
    const response = await api.put(`/admin/restaurants/${id}/waive-fee`, { waive });
    return response.data;
  },

  getRestaurantAnalytics: async (id: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get(`/admin/restaurants/${id}/analytics`, { params });
    return response.data;
  },
};

// Delivery Partner Management APIs
export const deliveryAPI = {
  getDeliveryPartners: async (params?: {
    page?: number;
    limit?: number;
    status?: boolean;
    city?: string;
  }): Promise<ApiResponse<DeliveryPartner[]>> => {
    const response = await api.get('/admin/delivery-partners', { params });
    return response.data;
  },

  getDeliveryPartnerDetails: async (id: string): Promise<ApiResponse<DeliveryPartner>> => {
    const response = await api.get(`/admin/delivery-partners/${id}`);
    return response.data;
  },

  onboardDeliveryPartner: async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleNumber: string;
    vehicleType: string;
    documents: any;
  }): Promise<ApiResponse<DeliveryPartner>> => {
    const response = await api.post('/admin/delivery-partners/onboard', data);
    return response.data;
  },

  updateDeliveryPartner: async (id: string, data: Partial<DeliveryPartner>): Promise<ApiResponse<DeliveryPartner>> => {
    const response = await api.put(`/admin/delivery-partners/${id}`, data);
    return response.data;
  },

  verifyDocuments: async (id: string, documents: any): Promise<ApiResponse<DeliveryPartner>> => {
    const response = await api.put(`/admin/delivery-partners/${id}/verify`, { documents });
    return response.data;
  },

  updateDeliveryPartnerStatus: async (id: string, isActive: boolean): Promise<ApiResponse<DeliveryPartner>> => {
    const response = await api.put(`/admin/delivery-partners/${id}/status`, { isActive });
    return response.data;
  },

  getPerformanceMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/delivery-partners/performance', { params });
    return response.data;
  },
};

// Customer Management APIs
export const customerAPI = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    status?: boolean;
    tier?: string;
  }): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  },

  getCustomerDetails: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get(`/admin/customers/${id}`);
    return response.data;
  },

  updateCustomerStatus: async (id: string, isActive: boolean): Promise<ApiResponse<Customer>> => {
    const response = await api.put(`/admin/customers/${id}/status`, { isActive });
    return response.data;
  },

  adjustWalletBalance: async (id: string, amount: number, reason: string): Promise<ApiResponse> => {
    const response = await api.post(`/admin/customers/${id}/wallet-adjust`, { amount, reason });
    return response.data;
  },

  adjustLoyaltyPoints: async (id: string, points: number, reason: string): Promise<ApiResponse> => {
    const response = await api.post(`/admin/customers/${id}/loyalty-adjust`, { points, reason });
    return response.data;
  },
};

// Order Management APIs
export const orderAPI = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    restaurantId?: string;
    deliveryPartnerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getOrderDetails: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  interveneOrder: async (id: string, newStatus: string, reason: string): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/admin/orders/${id}/intervene`, { newStatus, reason });
    return response.data;
  },

  reassignDelivery: async (id: string, newDeliveryPartnerId: string): Promise<ApiResponse<Order>> => {
    const response = await api.post(`/admin/orders/${id}/reassign-delivery`, { newDeliveryPartnerId });
    return response.data;
  },

  processRefund: async (id: string, refundAmount: number, reason: string): Promise<ApiResponse> => {
    const response = await api.post(`/admin/orders/${id}/refund`, { refundAmount, reason });
    return response.data;
  },
};

// Analytics APIs
export const analyticsAPI = {
  getPlatformOverview: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PlatformAnalytics>> => {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  getOrderTrends: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics/order-trends', { params });
    return response.data;
  },

  getRestaurantPerformance: async (params?: {
    startDate?: string;
    endDate?: string;
    sortBy?: 'revenue' | 'orders' | 'rating';
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics/restaurant-performance', { params });
    return response.data;
  },

  getDeliveryPerformance: async (params?: {
    startDate?: string;
    endDate?: string;
    sortBy?: 'deliveries' | 'earnings' | 'rating';
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics/delivery-performance', { params });
    return response.data;
  },

  getCustomerInsights: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics/customer-insights', { params });
    return response.data;
  },

  getRevenueBreakdown: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/analytics/revenue-breakdown', { params });
    return response.data;
  },
};

// Finance APIs
export const financeAPI = {
  getSubscriptionBilling: async (params?: {
    startDate?: string;
    endDate?: string;
    restaurantId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/finance/subscriptions', { params });
    return response.data;
  },

  getDailySettlements: async (params?: {
    date?: string;
    restaurantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/finance/settlements', { params });
    return response.data;
  },

  getDeliveryEarnings: async (params?: {
    startDate?: string;
    endDate?: string;
    deliveryPartnerId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/finance/delivery-earnings', { params });
    return response.data;
  },

  getTransactionHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<WalletTransaction[]>> => {
    const response = await api.get('/admin/finance/transactions', { params });
    return response.data;
  },

  processManualPayout: async (data: {
    userId: string;
    amount: number;
    payoutMethod: string;
    upiId?: string;
    bankAccount?: any;
    reason: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/admin/finance/manual-payout', data);
    return response.data;
  },

  reconcileWallet: async (data: {
    userId: string;
    expectedBalance: number;
    actualBalance: number;
    adjustmentReason: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/admin/finance/reconcile-wallet', data);
    return response.data;
  },

  getRefundHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/finance/refunds', { params });
    return response.data;
  },

  getPaymentGatewayReports: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/finance/payment-gateway', { params });
    return response.data;
  },
};

// HR APIs
export const hrAPI = {
  getEmployees: async (params?: {
    departmentId?: string;
    shiftId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Employee[]>> => {
    const response = await api.get('/admin/hr/employees', { params });
    return response.data;
  },

  getEmployeeDetails: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await api.get(`/admin/hr/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: {
    userId: string;
    departmentId?: string;
    shiftId?: string;
    employeeCode: string;
    designation: string;
    joiningDate: string;
    salary?: number;
    bankDetails?: any;
    documents?: any;
  }): Promise<ApiResponse<Employee>> => {
    const response = await api.post('/admin/hr/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> => {
    const response = await api.put(`/admin/hr/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/admin/hr/employees/${id}`);
    return response.data;
  },

  getDepartments: async (): Promise<ApiResponse<Department[]>> => {
    const response = await api.get('/admin/hr/departments');
    return response.data;
  },

  createDepartment: async (data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<Department>> => {
    const response = await api.post('/admin/hr/departments', data);
    return response.data;
  },

  getShifts: async (): Promise<ApiResponse<Shift[]>> => {
    const response = await api.get('/admin/hr/shifts');
    return response.data;
  },

  createShift: async (data: {
    name: string;
    startTime: string;
    endTime: string;
    days?: string[];
  }): Promise<ApiResponse<Shift>> => {
    const response = await api.post('/admin/hr/shifts', data);
    return response.data;
  },
};

export default api;