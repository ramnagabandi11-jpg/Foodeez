// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'restaurant' | 'delivery_partner' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends User {
  loyaltyPoints: number;
  totalOrders: number;
  addresses: Address[];
}

export interface Address {
  id: string;
  customerId: string;
  type: 'home' | 'work' | 'other';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisineTypes: string[];
  averageRating: number;
  totalRatings: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  bannerImage: string;
  logoImage: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  spicyLevel: 'none' | 'mild' | 'medium' | 'hot';
  customizations?: MenuItemCustomization[];
  nutritionInfo?: NutritionInfo;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  required: boolean;
  options: MenuItemCustomizationOption[];
}

export interface MenuItemCustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  restaurant: Restaurant;
  deliveryAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  itemTotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  totalAmount: number;
  specialInstructions?: string;
  estimatedPreparationTime: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  basePrice: number;
  customizations: Record<string, any>;
  specialInstructions?: string;
  subtotal: number;
  menuItem?: MenuItem;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'cancelled_by_restaurant'
  | 'cancelled_by_customer';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cod_pending';

export type PaymentMethod = 'online' | 'wallet' | 'cod';

// Review Types
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string;
  restaurantRating: number;
  foodRating: number;
  deliveryRating?: number;
  reviewText?: string;
  reviewImages: string[];
  isVerified: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  restaurantId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  lastUpdated: string;
}

// Search Types
export interface SearchFilters {
  query?: string;
  cuisine?: string;
  minRating?: number;
  maxDeliveryTime?: number;
  minOrder?: number;
  priceRange?: [number, number];
  isVeg?: boolean;
  isOpen?: boolean;
}

export interface SearchResult {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  total: number;
  hasMore: boolean;
}

// Cart Types
export interface CartItem {
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, any>;
  specialInstructions?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  restaurantId: string;
  restaurant: Restaurant;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  totalAmount: number;
  minimumOrder: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Component Props Types
export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
}

// Socket Types
export interface SocketOrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  data?: any;
}

export interface SocketDeliveryLocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface AddressForm {
  type: 'home' | 'work' | 'other';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// Payment Types
export interface PaymentDetails {
  method: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}