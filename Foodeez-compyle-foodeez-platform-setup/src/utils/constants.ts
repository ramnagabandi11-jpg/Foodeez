// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  PHONE_EXISTS: 'PHONE_EXISTS',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESTAURANT_NOT_FOUND: 'RESTAURANT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INSUFFICIENT_WALLET_BALANCE: 'INSUFFICIENT_WALLET_BALANCE',
  INVALID_PROMO_CODE: 'INVALID_PROMO_CODE',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
} as const;

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  DAILY_CHARGE: 100, // Rs. 100
  TRIAL_DAYS: 7,
  PAYMENT_TIME: 0, // 12:00 AM IST
  RETRY_INTERVALS: [1, 6] // hours
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  VALIDITY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_REQUESTS: 5,
  RATE_LIMIT_WINDOW_HOURS: 1,
  RESEND_WAIT_SECONDS: 30
} as const;

// Order Configuration
export const ORDER_CONFIG = {
  RESTAURANT_RESPONSE_TIMEOUT_MINUTES: 2,
  DELIVERY_ASSIGNMENT_TIMEOUT_SECONDS: 30,
  DELIVERY_BROADCAST_TIMEOUT_MINUTES: 2,
  MAX_SEARCH_RADIUS_KM: 10,
  AUTO_ASSIGN_RADIUS_KM: 3,
  BROADCAST_RADIUS_KM: 5,
  DELIVERY_ACCEPTANCE_RATE_THRESHOLD: 70,
  PREPARATION_TIME_EXCEEDED_ALERT_MINUTES: 15
} as const;

// Payment Configuration
export const PAYMENT_CONFIG = {
  PLATFORM_FEE_MIN: 2,
  PLATFORM_FEE_MAX: 5,
  PLATFORM_FEE_PERCENTAGE: [1, 2], // min and max percentage
  MIN_ORDER_FOR_COD: 50,
  MAX_ORDER_FOR_COD: 1000,
  DELIVERY_FEE_TIERS: {
    0: 0, // < 2km
    2: 20,
    5: 30,
    10: 40,
    50: 50 // > 10km
  },
  PREMIUM_DELIVERY_CHARGES: 20,
  WALLET_MIN_BALANCE: 0,
  WALLET_MAX_BALANCE: 10000,
  WALLET_ADD_AMOUNTS: [100, 200, 500, 1000, 2000, 5000]
} as const;

// Loyalty Points Configuration
export const LOYALTY_CONFIG = {
  POINTS_PER_RUPEE: 0.01, // 1 point per Rs. 100
  POINTS_EXPIRY_DAYS: 365,
  POINTS_TO_RUPEE_RATIO: 100, // 100 points = Rs. 10
  REVIEW_BONUS_POINTS: 10,
  REFERRAL_BONUS_POINTS: 50,
  BIRTHDAY_MULTIPLIER: 2,
  MAX_POINTS_REDEMPTION_PERCENTAGE: 50
} as const;

// Delivery Partner Configuration
export const DELIVERY_CONFIG = {
  BASE_FEE_MIN: 20,
  BASE_FEE_MAX: 50,
  PEAK_HOURS: [[12, 14], [19, 22]], // [[12:00-14:00], [19:00-22:00]]
  PEAK_HOUR_BONUS: 10,
  RAIN_BONUS: 15,
  PREMIUM_DELIVERY_BONUS: 20,
  MINIMUM_WITHDRAWAL: 100,
  MAXIMUM_WITHDRAWAL_PER_DAY: 50000,
  LOCATION_UPDATE_INTERVAL_SECONDS: 10
} as const;

// Promo Code Configuration
export const PROMO_CONFIG = {
  MAX_DISCOUNT_PERCENTAGE: 100,
  MIN_ORDER_VALUE_DEFAULT: 0,
  USAGE_LIMIT_DEFAULT: 1
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// Redis Keys
export const REDIS_KEYS = {
  SESSION: 'session:{userId}:{tokenId}',
  OTP_LIMIT: 'otp_limit:{phoneOrEmail}',
  LOGIN_LIMIT: 'login_limit:{ipAddress}',
  DELIVERY_PARTNERS_LOCATIONS: 'delivery_partners:locations',
  ORDER_STATUS: 'order_status:{orderId}',
  RESTAURANT_ONLINE: 'restaurant_online:{restaurantId}',
  RATE_LIMIT: 'rate_limit:{key}'
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Customer
  ORDER_STATUS_UPDATE: 'order:status_update',
  DELIVERY_LOCATION_UPDATE: 'delivery:location_update',
  NOTIFICATION_NEW: 'notification:new',

  // Restaurant
  ORDER_NEW: 'order:new',
  ORDER_ASSIGNED: 'order:assigned',
  ORDER_PICKED_UP: 'order:picked_up',

  // Delivery Partner
  DELIVERY_NEW_REQUEST: 'delivery:new_request',
  DELIVERY_AUTO_ASSIGNED: 'delivery:auto_assigned'
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_RECEIPT: 'payment_receipt',
  SUBSCRIPTION_INVOICE: 'subscription_invoice',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification',
  ORDER_DELIVERED: 'order_delivered',
  REFUND_PROCESSED: 'refund_processed'
} as const;

// SMS Templates
export const SMS_TEMPLATES = {
  OTP: 'otp',
  ORDER_PLACED: 'order_placed',
  ORDER_OUT_FOR_DELIVERY: 'order_out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  SUBSCRIPTION_PAYMENT: 'subscription_payment',
  EARNINGS_SUMMARY: 'earnings_summary'
} as const;

// Image Configuration
export const IMAGE_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: { width: 150, height: 150 },
  MEDIUM_SIZE: { width: 400, height: 400 },
  LARGE_SIZE: { width: 1200, height: 1200 }
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN: { windowMs: 1 * 60 * 1000, max: 5 }, // 5 attempts per 1 minute
  OTP: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 OTPs per hour
  API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  PAYMENT: { windowMs: 60 * 1000, max: 3 } // 3 payment attempts per minute
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_SEARCH_RESULTS: 100,
  ELASTICSEARCH_TIMEOUT_MS: 5000,
  CACHE_TTL_SECONDS: 300
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  BATCH_SIZE: 1000,
  DAILY_REPORT_TIME: 0, // Midnight
  WEEKLY_REPORT_DAY: 1, // Monday
  MONTHLY_REPORT_DATE: 1,
  DATA_RETENTION_DAYS: 365
} as const;
