// User Types
export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  DELIVERY_PARTNER = 'delivery_partner',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted'
}

export interface IUser {
  id: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Order Types
export enum OrderStatus {
  PLACED = 'placed',
  RESTAURANT_NOTIFIED = 'restaurant_notified',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED = 'assigned',
  ACCEPTED_BY_DRIVER = 'accepted_by_driver',
  DRIVER_ARRIVED_AT_RESTAURANT = 'driver_arrived_at_restaurant',
  PICKED_UP = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  ARRIVED_AT_CUSTOMER = 'arrived_at_customer',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  COD_PENDING = 'cod_pending'
}

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  PAYTM = 'paytm',
  WALLET = 'wallet',
  COD = 'cod'
}

export interface IOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string;
  deliveryAddressId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  itemTotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  promoCode?: string;
  loyaltyPointsUsed: number;
  totalAmount: number;
  specialInstructions?: string;
  estimatedPreparationTime?: number;
  estimatedDeliveryTime?: Date;
  isPremiumDelivery: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Restaurant Types
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

export interface IRestaurant {
  id: string;
  userId: string;
  name: string;
  description?: string;
  fssaiNumber: string;
  ownerName: string;
  ownerPhone: string;
  businessEmail: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  cuisineTypes: string[];
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  averageRating: number;
  totalRatings: number;
  averagePreparationTime: number;
  minimumOrderValue: number;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery Partner Types
export interface IDeliveryPartner {
  id: string;
  userId: string;
  dateOfBirth: Date;
  aadhaarNumber: string;
  licenseNumber: string;
  vehicleType: 'bike' | 'scooter' | 'bicycle';
  vehicleNumber: string;
  serviceCity: string;
  serviceLatitude: number;
  serviceLongitude: number;
  currentLatitude?: number;
  currentLongitude?: number;
  isOnline: boolean;
  isAvailable: boolean;
  acceptanceRate: number;
  totalDeliveries: number;
  averageRating: number;
  totalRatings: number;
  cashInHand: number;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication Types
export interface IAuthPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

// Request User (Express)
export interface IRequestUser {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

export interface IAuthenticatedRequest extends Express.Request {
  user?: IRequestUser;
}

// Error Types
export interface IErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;
}
