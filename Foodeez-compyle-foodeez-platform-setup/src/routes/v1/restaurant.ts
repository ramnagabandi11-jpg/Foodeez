import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getOrders,
  acceptOrder,
  rejectOrder,
  markOrderReady,
  getAnalytics,
  getRevenueBreakdown,
  getSubscription,
  getSubscriptionHistory,
  getWallet,
  getWalletTransactions,
} from '@/controllers/restaurantController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All restaurant routes require authentication with restaurant role
router.use(authenticate, authorize(['restaurant']));

// Profile routes
router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('address').optional().isString().trim().isLength({ max: 500 }),
    body('phone').optional().isMobilePhone('en-IN'),
    body('openingTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('closingTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('cuisineTypes').optional().isArray(),
    body('logo').optional().isURL(),
    validate,
  ],
  updateProfile
);

// Menu routes
router.get('/menu', getMenu);

router.post(
  '/menu',
  [
    body('name').isString().trim().isLength({ min: 2, max: 200 }),
    body('description').isString().trim().isLength({ max: 1000 }),
    body('price').isFloat({ min: 0 }),
    body('category').isString().trim().isLength({ min: 2, max: 100 }),
    body('preparationTime').isInt({ min: 1, max: 300 }),
    body('isVegetarian').optional().isBoolean(),
    body('isVegan').optional().isBoolean(),
    body('isGlutenFree').optional().isBoolean(),
    body('spiceLevel').optional().isIn(['none', 'mild', 'medium', 'hot', 'extra_hot']),
    body('isAvailable').optional().isBoolean(),
    body('image').optional().isURL(),
    body('images').optional().isArray(),
    body('customizations').optional().isArray(),
    body('nutrition').optional().isObject(),
    body('allergens').optional().isArray(),
    body('tags').optional().isArray(),
    validate,
  ],
  addMenuItem
);

router.put(
  '/menu/:menuItemId',
  [
    param('menuItemId').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('preparationTime').optional().isInt({ min: 1, max: 300 }),
    body('isVegetarian').optional().isBoolean(),
    body('isVegan').optional().isBoolean(),
    body('isGlutenFree').optional().isBoolean(),
    body('spiceLevel').optional().isIn(['none', 'mild', 'medium', 'hot', 'extra_hot']),
    body('isAvailable').optional().isBoolean(),
    body('images').optional().isArray(),
    body('customizations').optional().isArray(),
    body('nutrition').optional().isObject(),
    body('allergens').optional().isArray(),
    body('tags').optional().isArray(),
    validate,
  ],
  updateMenuItem
);

router.delete(
  '/menu/:menuItemId',
  [
    param('menuItemId').isMongoId(),
    validate,
  ],
  deleteMenuItem
);

router.patch(
  '/menu/:menuItemId/availability',
  [
    param('menuItemId').isMongoId(),
    body('isAvailable').isBoolean(),
    validate,
  ],
  toggleAvailability
);

// Order routes
router.get('/orders', getOrders);

router.post(
  '/orders/:orderId/accept',
  [
    param('orderId').isUUID(),
    body('estimatedPreparationTime').isInt({ min: 1, max: 180 }),
    validate,
  ],
  acceptOrder
);

router.post(
  '/orders/:orderId/reject',
  [
    param('orderId').isUUID(),
    body('rejectionReason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  rejectOrder
);

router.put(
  '/orders/:orderId/ready',
  [
    param('orderId').isUUID(),
    validate,
  ],
  markOrderReady
);

// Analytics routes
router.get('/analytics', getAnalytics);

router.get('/analytics/revenue', getRevenueBreakdown);

// Subscription routes
router.get('/subscription', getSubscription);

router.get('/subscription/history', getSubscriptionHistory);

// Wallet routes
router.get('/wallet', getWallet);

router.get('/wallet/transactions', getWalletTransactions);

export default router;
