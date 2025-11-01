// Export all services
export * as authService from './authService';
export * as orderService from './orderService';
export * as paymentService from './paymentService';
export * as notificationService from './notificationService';
export * as searchService from './searchService';
export * as deliveryService from './deliveryService';

export default {
  authService: require('./authService').default,
  orderService: require('./orderService').default,
  paymentService: require('./paymentService').default,
  notificationService: require('./notificationService').default,
  searchService: require('./searchService').default,
  deliveryService: require('./deliveryService').default,
};
