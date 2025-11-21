// API Configuration for Delivery Partner Mobile App

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3000/v1'
    : 'http://18.60.53.146:3000/v1',
  SOCKET_URL: __DEV__
    ? 'http://localhost:3000'
    : 'http://18.60.53.146:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    CURRENT_USER: '/auth/me',
  },

  // Delivery Partner
  DELIVERY: {
    PROFILE: '/delivery-partner/profile',
    ORDERS: '/delivery-partner/orders',
    ACCEPT_ORDER: (orderId: string) => `/delivery-partner/orders/${orderId}/accept`,
    REJECT_ORDER: (orderId: string) => `/delivery-partner/orders/${orderId}/reject`,
    UPDATE_LOCATION: '/delivery-partner/location',
    UPDATE_STATUS: (orderId: string) => `/delivery-partner/orders/${orderId}/status`,
    COMPLETE_ORDER: (orderId: string) => `/delivery-partner/orders/${orderId}/complete`,
    EARNINGS: '/delivery-partner/earnings',
    RATING: '/delivery-partner/rating',
  },

  // Orders
  ORDERS: {
    DETAIL: (id: string) => `/orders/${id}`,
    TRACK: (id: string) => `/orders/${id}/track`,
    CUSTOMER_INFO: (id: string) => `/orders/${id}/customer`,
  },

  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    WITHDRAW: '/wallet/withdraw',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};