/**
 * API Client for Foodeez Customer Application
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 10000;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date().getTime() - response.config.metadata.startTime;
      console.log(`API Response: ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            window.location.href = '/auth/login';
          }
          break;
        case 403:
          // Forbidden - show access denied message
          console.error('Access denied');
          break;
        case 500:
          // Server error - show error page
          console.error('Server error');
          break;
      }
    }

    return Promise.reject(error);
  }
);

// API Client Class
class ApiClient {
  // Auth Methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }

  async verifyPhone(phoneNumber: string, code: string): Promise<ApiResponse<{ verified: boolean }>> {
    const response = await apiClient.post('/auth/verify-phone', { phoneNumber, code });
    return response.data;
  }

  async sendOTP(phoneNumber: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post('/auth/send-otp', { phoneNumber });
    return response.data;
  }

  // User Profile Methods
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get('/user/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put('/user/password', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Address Methods
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const response = await apiClient.get('/user/addresses');
    return response.data;
  }

  async addAddress(data: AddAddressData): Promise<ApiResponse<Address>> {
    const response = await apiClient.post('/user/addresses', data);
    return response.data;
  }

  async updateAddress(id: string, data: UpdateAddressData): Promise<ApiResponse<Address>> {
    const response = await apiClient.put(`/user/addresses/${id}`, data);
    return response.data;
  }

  async deleteAddress(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/user/addresses/${id}`);
    return response.data;
  }

  async setDefaultAddress(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/user/addresses/${id}/default`);
    return response.data;
  }

  // Restaurant Methods
  async getRestaurants(params?: RestaurantSearchParams): Promise<ApiResponse<RestaurantsResponse>> {
    const response = await apiClient.get('/restaurants', { params });
    return response.data;
  }

  async getRestaurant(id: string): Promise<ApiResponse<Restaurant>> {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  }

  async getRestaurantMenu(id: string): Promise<ApiResponse<Menu>> {
    const response = await apiClient.get(`/restaurants/${id}/menu`);
    return response.data;
  }

  async searchRestaurants(query: string, filters?: SearchFilters): Promise<ApiResponse<SearchResponse>> {
    const response = await apiClient.get('/restaurants/search', {
      params: { query, ...filters }
    });
    return response.data;
  }

  async getRestaurantReviews(id: string, params?: ReviewSearchParams): Promise<ApiResponse<ReviewsResponse>> {
    const response = await apiClient.get(`/restaurants/${id}/reviews`, { params });
    return response.data;
  }

  async getPopularRestaurants(): Promise<ApiResponse<Restaurant[]>> {
    const response = await apiClient.get('/restaurants/popular');
    return response.data;
  }

  async getNearbyRestaurants(lat: number, lng: number): Promise<ApiResponse<Restaurant[]>> {
    const response = await apiClient.get('/restaurants/nearby', { params: { lat, lng } });
    return response.data;
  }

  // Cart Methods
  async getCart(): Promise<ApiResponse<Cart>> {
    const response = await apiClient.get('/cart');
    return response.data;
  }

  async addToCart(data: AddToCartData): Promise<ApiResponse<Cart>> {
    const response = await apiClient.post('/cart/items', data);
    return response.data;
  }

  async updateCartItem(itemId: string, data: UpdateCartItemData): Promise<ApiResponse<Cart>> {
    const response = await apiClient.put(`/cart/items/${itemId}`, data);
    return response.data;
  }

  async removeCartItem(itemId: string): Promise<ApiResponse<Cart>> {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  }

  async clearCart(): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete('/cart');
    return response.data;
  }

  async applyPromoCode(code: string): Promise<ApiResponse<{ discount: number }>> {
    const response = await apiClient.post('/cart/promo', { code });
    return response.data;
  }

  // Order Methods
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    const response = await apiClient.post('/orders', data);
    return response.data;
  }

  async getOrders(params?: OrderSearchParams): Promise<ApiResponse<OrdersResponse>> {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  }

  async cancelOrder(id: string, reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  }

  async trackOrder(id: string): Promise<ApiResponse<OrderTracking>> {
    const response = await apiClient.get(`/orders/${id}/track`);
    return response.data;
  }

  async reorderFromOrder(id: string): Promise<ApiResponse<Cart>> {
    const response = await apiClient.post(`/orders/${id}/reorder`);
    return response.data;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const response = await apiClient.get('/user/payment-methods');
    return response.data;
  }

  async addPaymentMethod(data: AddPaymentMethodData): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.post('/user/payment-methods', data);
    return response.data;
  }

  async updatePaymentMethod(id: string, data: UpdatePaymentMethodData): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.put(`/user/payment-methods/${id}`, data);
    return response.data;
  }

  async deletePaymentMethod(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/user/payment-methods/${id}`);
    return response.data;
  }

  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/user/payment-methods/${id}/default`);
    return response.data;
  }

  // Wallet Methods
  async getWallet(): Promise<ApiResponse<Wallet>> {
    const response = await apiClient.get('/user/wallet');
    return response.data;
  }

  async addFunds(amount: number, paymentMethodId: string): Promise<ApiResponse<{ transactionId: string }>> {
    const response = await apiClient.post('/user/wallet/add-funds', { amount, paymentMethodId });
    return response.data;
  }

  async getWalletTransactions(params?: TransactionSearchParams): Promise<ApiResponse<TransactionsResponse>> {
    const response = await apiClient.get('/user/wallet/transactions', { params });
    return response.data;
  }

  // Review & Rating Methods
  async createReview(data: CreateReviewData): Promise<ApiResponse<Review>> {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  }

  async updateReview(id: string, data: UpdateReviewData): Promise<ApiResponse<Review>> {
    const response = await apiClient.put(`/reviews/${id}`, data);
    return response.data;
  }

  async deleteReview(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response.data;
  }

  async getUserReviews(params?: ReviewSearchParams): Promise<ApiResponse<ReviewsResponse>> {
    const response = await apiClient.get('/user/reviews', { params });
    return response.data;
  }

  // Notification Methods
  async getNotifications(params?: NotificationSearchParams): Promise<ApiResponse<NotificationsResponse>> {
    const response = await apiClient.get('/user/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put(`/user/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.put('/user/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.delete(`/user/notifications/${id}`);
    return response.data;
  }

  // Support Methods
  async createSupportTicket(data: CreateSupportTicketData): Promise<ApiResponse<SupportTicket>> {
    const response = await apiClient.post('/support/tickets', data);
    return response.data;
  }

  async getSupportTickets(params?: SupportTicketSearchParams): Promise<ApiResponse<SupportTicketsResponse>> {
    const response = await apiClient.get('/support/tickets', { params });
    return response.data;
  }

  async getSupportTicket(id: string): Promise<ApiResponse<SupportTicket>> {
    const response = await apiClient.get(`/support/tickets/${id}`);
    return response.data;
  }

  async addSupportMessage(ticketId: string, data: AddSupportMessageData): Promise<ApiResponse<SupportMessage>> {
    const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, data);
    return response.data;
  }

  // Preferences Methods
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.get('/user/preferences');
    return response.data;
  }

  async updateUserPreferences(data: UpdateUserPreferencesData): Promise<ApiResponse<UserPreferences>> {
    const response = await apiClient.put('/user/preferences', data);
    return response.data;
  }
}

// Create singleton instance
const api = new ApiClient();

// Helper function for handling API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Type definitions for API methods
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  acceptTerms: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserProfile {
  user: User;
  profile: CustomerProfile;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface AddAddressData {
  type: 'home' | 'work' | 'other';
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  instructions?: string;
}

interface UpdateAddressData extends Partial<AddAddressData> {}

interface RestaurantSearchParams {
  page?: number;
  limit?: number;
  cuisine?: string;
  dietary?: string;
  priceRange?: string;
  rating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchFilters {
  cuisine?: string[];
  dietary?: string[];
  priceRange?: [number, number];
  rating?: number;
  features?: string[];
}

interface SearchResponse {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  totalCount: number;
  hasMore: boolean;
}

interface RestaurantsResponse {
  restaurants: Restaurant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ReviewSearchParams {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: 'date' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface AddToCartData {
  menuItemId: string;
  quantity: number;
  customizations?: SelectedCustomization[];
  specialInstructions?: string;
}

interface UpdateCartItemData {
  quantity?: number;
  customizations?: SelectedCustomization[];
  specialInstructions?: string;
}

interface CreateOrderData {
  restaurantId: string;
  items: OrderItem[];
  deliveryAddress: Address;
  paymentMethodId: string;
  promoCode?: string;
  notes?: string;
  deliveryInstructions?: string;
  contactlessDelivery?: boolean;
}

interface OrderSearchParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  restaurantId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'status' | 'total';
  sortOrder?: 'asc' | 'desc';
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderTracking {
  order: Order;
  driver?: DeliveryDriver;
  estimatedTime: string;
  currentStatus: OrderStatus;
  timeline: OrderTimeline[];
}

interface AddPaymentMethodData {
  type: PaymentMethod['type'];
  details: CardDetails | UPIDetails | WalletDetails;
  isDefault?: boolean;
}

interface UpdatePaymentMethodData {
  isDefault?: boolean;
}

interface TransactionSearchParams {
  page?: number;
  limit?: number;
  type?: 'credit' | 'debit';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface TransactionsResponse {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateReviewData {
  orderId: string;
  restaurantId: string;
  menuItemId?: string;
  rating: number;
  comment: string;
  images?: string[];
}

interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

interface NotificationSearchParams {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: NotificationType;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateSupportTicketData {
  subject: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderId?: string;
  attachments?: string[];
}

interface SupportTicketSearchParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: string;
  priority?: string;
}

interface SupportTicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AddSupportMessageData {
  message: string;
  attachments?: string[];
}

interface UpdateUserPreferencesData {
  notifications?: Partial<UserPreferences['notifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
  app?: Partial<UserPreferences['app']>;
}

export default api;