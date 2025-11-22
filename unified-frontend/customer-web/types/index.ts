/**
 * TypeScript Type Definitions for Foodeez Customer Application
 */

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'customer' | 'premium_customer';
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile extends User {
  addresses: Address[];
  preferences: CustomerPreferences;
  wallet: Wallet;
  loyaltyPoints: number;
  membershipTier: 'basic' | 'silver' | 'gold' | 'platinum';
  dietaryRestrictions: string[];
  favoriteCuisines: string[];
}

export interface CustomerPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  privacy: {
    shareLocation: boolean;
    showProfilePicture: boolean;
    allowRecommendations: boolean;
  };
  app: {
    language: string;
    currency: string;
    darkMode: boolean;
  };
}

// Address Types
export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  instructions?: string;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  logo: string;
  coverImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: number;
  isOpen: boolean;
  address: Address;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  workingHours: WorkingHours[];
  features: RestaurantFeature[];
  verified: boolean;
  promotionalOffers?: PromotionalOffer[];
  averagePreparationTime: number;
  lastOrderTime?: string;
}

export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface RestaurantFeature {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface PromotionalOffer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minimumOrder: number;
  validFrom: string;
  validTo: string;
  applicableItems?: string[];
  code?: string;
  usageLimit?: number;
  usageCount: number;
}

// Menu Types
export interface Menu {
  id: string;
  restaurantId: string;
  categories: MenuCategory[];
  currency: string;
  taxes: Tax[];
  deliverySettings: DeliverySettings;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  order: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: 0 | 1 | 2 | 3;
  preparationTime: number;
  calories?: number;
  allergens: string[];
  isAvailable: boolean;
  customizations: MenuCustomization[];
  nutritionalInfo?: NutritionalInfo;
  rating?: number;
  reviewCount?: number;
  bestseller: boolean;
  chefSpecial: boolean;
  orderCount: number;
}

export interface MenuCustomization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  defaultSelected: boolean;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Tax {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableTo: 'all' | 'food' | 'beverage' | 'delivery';
}

export interface DeliverySettings {
  freeDeliveryMinimum: number;
  deliveryZones: DeliveryZone[];
  deliveryTime: {
    minimum: number;
    maximum: number;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
    radius: number;
  };
  deliveryFee: number;
}

// Order Types
export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  delivery: DeliveryDetails;
  payment: PaymentDetails;
  timeline: OrderTimeline[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  driverId?: string;
  restaurant?: Restaurant;
  customer?: CustomerProfile;
  driver?: DeliveryDriver;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  price: number;
}

export interface SelectedCustomization {
  customizationId: string;
  customizationName: string;
  selectedOptions: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface OrderPricing {
  subtotal: number;
  taxes: TaxBreakdown[];
  deliveryFee: number;
  serviceFee: number;
  tip?: number;
  discount?: DiscountDetails;
  total: number;
}

export interface TaxBreakdown {
  name: string;
  value: number;
  amount: number;
}

export interface DiscountDetails {
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  amount: number;
}

export interface DeliveryDetails {
  address: Address;
  instructions?: string;
  contactlessDelivery: boolean;
  leaveAtDoor: boolean;
  deliveryInstructions?: string;
}

export interface PaymentDetails {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gateway: 'stripe' | 'razorpay' | 'paypal' | 'wallet';
  paidAt?: string;
  refund?: RefundDetails;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'net_banking' | 'cod';
  details: CardDetails | UPIDetails | WalletDetails;
  isDefault: boolean;
  lastUsed?: string;
}

export interface CardDetails {
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName?: string;
}

export interface UPIDetails {
  upiId: string;
  provider: string;
}

export interface WalletDetails {
  balance: number;
}

export interface RefundDetails {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface OrderTimeline {
  id: string;
  status: OrderStatus;
  timestamp: string;
  note?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Delivery Driver Types
export interface DeliveryDriver {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  avatar?: string;
  vehicle: Vehicle;
  rating: number;
  deliveryCount: number;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  languages: string[];
}

export interface Vehicle {
  type: 'motorcycle' | 'scooter' | 'car' | 'bicycle';
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  photo?: string;
}

// Wallet & Loyalty
export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: 'order' | 'refund' | 'reward' | 'topup' | 'withdrawal';
  reference?: string;
  createdAt: string;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  tiers: LoyaltyTier[];
  pointsPerCurrency: number;
  redemptionRate: number;
  expiryPolicy: ExpiryPolicy;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minimumPoints: number;
  benefits: string[];
  badge: string;
}

export interface ExpiryPolicy {
  months: number;
  notifications: number[];
}

// Review & Rating Types
export interface Review {
  id: string;
  customerId: string;
  orderId: string;
  restaurantId: string;
  menuItemId?: string;
  rating: number;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  response?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerProfile;
}

export interface ReviewResponse {
  id: string;
  restaurantId: string;
  comment: string;
  respondedAt: string;
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  cuisine?: string[];
  dietary?: string[];
  priceRange?: [number, number];
  rating?: number;
  deliveryTime?: number;
  features?: string[];
  distance?: number;
  sortOption?: SortOption;
}

export interface SortOption {
  id: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchResult {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  totalCount: number;
  hasMore: boolean;
  facets: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  options: SearchFacetOption[];
}

export interface SearchFacetOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

// Cart Types
export interface Cart {
  id: string;
  customerId: string;
  restaurantId: string;
  items: CartItem[];
  pricing: CartPricing;
  deliveryAddress?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  restaurant?: Restaurant;
}

export interface CartItem {
  menuItemId: string;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  menuItem?: MenuItem;
}

export interface CartPricing {
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  serviceFee: number;
  discount?: number;
  total: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
}

export type NotificationType =
  | 'order_status'
  | 'delivery_update'
  | 'promotion'
  | 'review_request'
  | 'wallet_update'
  | 'account_update'
  | 'system';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// UI State Types
export interface AppState {
  user: User | null;
  cart: Cart | null;
  addresses: Address[];
  notifications: Notification[];
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// Event Types
export interface OrderStatusUpdateEvent {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  driver?: DeliveryDriver;
  estimatedTime?: string;
}

export interface DriverLocationUpdateEvent {
  orderId: string;
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface NewMessageEvent {
  conversationId: string;
  message: ChatMessage;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Chat Types
export interface ChatConversation {
  id: string;
  participants: string[];
  orderId?: string;
  restaurantId?: string;
  type: 'customer_support' | 'driver' | 'restaurant';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'system';
  timestamp: string;
  read: boolean;
  metadata?: Record<string, any>;
}