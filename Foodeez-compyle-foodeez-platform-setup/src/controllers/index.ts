// Export all controllers
export * as authController from './authController';
export * as orderController from './orderController';
export * as paymentController from './paymentController';
export * as searchController from './searchController';

export default {
  authController: require('./authController').default,
  orderController: require('./orderController').default,
  paymentController: require('./paymentController').default,
  searchController: require('./searchController').default,
};
