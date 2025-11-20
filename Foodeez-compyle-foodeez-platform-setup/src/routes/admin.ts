import express from 'express';
import { body, query } from 'express-validator';
import {
  getDashboardOverview,
  getOrders,
  getOrderDetails,
  getRestaurants,
  getCustomers,
  getDeliveryPartners,
  getAnalytics,
  sendPromotionalEmail,
} from '@/controllers/adminController';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken, requireRole } from '@/middleware/auth';

const router = express.Router();

// Apply authentication and admin role middleware to all admin routes
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * @route   GET /api/admin/dashboard/overview
 * @desc    Get dashboard overview statistics
 * @access  Admin
 */
router.get('/dashboard/overview', getDashboardOverview);

/**
 * @route   GET /api/admin/orders
 * @desc    Get orders with filters and pagination
 * @access  Admin
 */
router.get('/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['placed', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered', 'cancelled_by_customer', 'cancelled_by_restaurant', 'cancelled_by_delivery_partner']),
    query('restaurantId').optional().isUUID(),
    query('customerId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalAmount', 'status']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  getOrders
);

/**
 * @route   GET /api/admin/orders/:orderId
 * @desc    Get order details with full information
 * @access  Admin
 */
router.get('/orders/:orderId',
  [
    query('orderId').isUUID(),
  ],
  validateRequest,
  getOrderDetails
);

/**
 * @route   GET /api/admin/restaurants
 * @desc    Get restaurants management data
 * @access  Admin
 */
router.get('/restaurants',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean(),
    query('isOpen').optional().isBoolean(),
    query('city').optional().isString().trim(),
    query('cuisine').optional().isString().trim(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'averageRating', 'totalOrders']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  getRestaurants
);

/**
 * @route   GET /api/admin/customers
 * @desc    Get customers management data
 * @access  Admin
 */
router.get('/customers',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean(),
    query('city').optional().isString().trim(),
    query('registeredFrom').optional().isISO8601(),
    query('registeredTo').optional().isISO8601(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'totalOrders', 'totalSpent']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  getCustomers
);

/**
 * @route   GET /api/admin/delivery-partners
 * @desc    Get delivery partners management data
 * @access  Admin
 */
router.get('/delivery-partners',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean(),
    query('isAvailable').optional().isBoolean(),
    query('city').optional().isString().trim(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'totalDeliveries']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']),
  ],
  validateRequest,
  getDeliveryPartners
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Admin
 */
router.get('/analytics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['revenue', 'orders', 'customers', 'restaurants']),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  validateRequest,
  getAnalytics
);

/**
 * @route   POST /api/admin/promotional-email
 * @desc    Send promotional email to customers
 * @access  Admin
 */
router.post('/promotional-email',
  [
    body('subject').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('title').notEmpty().trim().isLength({ min: 3, max: 100 }),
    body('description').notEmpty().trim().isLength({ min: 10, max: 1000 }),
    body('discountCode').optional().isString().trim().isLength({ min: 3, max: 20 }),
    body('validUntil').optional().isISO8601(),
    body('termsAndConditions').optional().isString().trim().isLength({ max: 1000 }),
    body('customerFilter').optional().isObject(),
  ],
  validateRequest,
  sendPromotionalEmail
);

export default router;