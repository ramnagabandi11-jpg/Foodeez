// API Configuration for Customer Mobile App

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

  // Restaurants
  RESTAURANTS: {
    LIST: '/restaurants',
    DETAIL: (id: string) => `/restaurants/${id}`,
    MENU: (id: string) => `/restaurants/${id}/menu`,
    SEARCH: '/search/restaurants',
  },

  // Orders
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    TRACK: (id: string) => `/orders/${id}/track`,
  },

  // Payments
  PAYMENTS: {
    INITIATE: '/payment/initiate',
    VERIFY: '/payment/razorpay/verify',
    WALLET_ADD: '/payment/wallet/add-money',
    REFUND: (orderId: string) => `/payment/refund/${orderId}`,
  },

  // Reviews
  REVIEWS: {
    CREATE: '/reviews',
    RESTAURANT_LIST: (restaurantId: string) => `/reviews/restaurant/${restaurantId}`,
    UPDATE: (id: string) => `/reviews/${id}`,
    DELETE: (id: string) => `/reviews/${id}`,
    UPLOAD_PHOTOS: '/reviews/upload-photos',
  },

  // User
  USER: {
    PROFILE: '/auth/profile',
    ADDRESSES: '/addresses',
    FAVORITES: '/favorites',
    ORDER_HISTORY: '/orders/history',
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