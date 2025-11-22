import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  requireAdmin,
  getAllUsersController,
  updateUserStatusController,
  getPendingRestaurantsController,
  approveOrRejectRestaurantController,
  getAllOrdersController,
  getDashboardAnalyticsController,
  getRevenueAnalyticsController,
  getUserGrowthAnalyticsController,
  getRestaurantPerformanceAnalyticsController,
  getAdminLogsController,
} from '@/controllers/adminController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['customer', 'restaurant', 'delivery_partner', 'admin'])
      .withMessage('Role must be one of: customer, restaurant, delivery_partner, admin'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be between 2 and 100 characters'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ],
  getAllUsersController
);

/**
 * @route   PUT /api/v1/admin/users/:userId/status
 * @desc    Activate or deactivate a user
 * @access  Private (Admin only)
 */
router.put(
  '/users/:userId/status',
  [
    param('userId')
      .isUUID()
      .withMessage('Valid user ID is required'),
    body('isActive')
      .isBoolean()
      .withMessage('Is active must be a boolean'),
    body('deactivationReason')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Deactivation reason must be between 10 and 500 characters'),
  ],
  updateUserStatusController
);

/**
 * @route   GET /api/v1/admin/restaurants/pending
 * @desc    Get pending restaurant approvals
 * @access  Private (Admin only)
 */
router.get(
  '/restaurants/pending',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search term must be between 2 and 100 characters'),
  ],
  getPendingRestaurantsController
);

/**
 * @route   PUT /api/v1/admin/restaurants/:restaurantId/approve
 * @desc    Approve or reject a restaurant
 * @access  Private (Admin only)
 */
router.put(
  '/restaurants/:restaurantId/approve',
  [
    param('restaurantId')
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
    body('isApproved')
      .isBoolean()
      .withMessage('Is approved must be a boolean'),
    body('rejectionReason')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters'),
  ],
  approveOrRejectRestaurantController
);

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders with advanced filtering
 * @access  Private (Admin only)
 */
router.get(
  '/orders',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
      .withMessage('Status must be a valid order status'),
    query('restaurantId')
      .optional()
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
    query('customerId')
      .optional()
      .isUUID()
      .withMessage('Valid customer ID is required'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Min amount must be a positive number'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max amount must be a positive number'),
  ],
  getAllOrdersController
);

/**
 * @route   GET /api/v1/admin/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/dashboard',
  getDashboardAnalyticsController
);

/**
 * @route   GET /api/v1/admin/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/revenue',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Period must be one of: daily, weekly, monthly'),
  ],
  getRevenueAnalyticsController
);

/**
 * @route   GET /api/v1/admin/analytics/users
 * @desc    Get user growth analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/users',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Period must be one of: daily, weekly, monthly'),
  ],
  getUserGrowthAnalyticsController
);

/**
 * @route   GET /api/v1/admin/analytics/restaurants
 * @desc    Get restaurant performance analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/restaurants',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('sortBy')
      .optional()
      .isIn(['revenue', 'orders', 'rating'])
      .withMessage('Sort by must be one of: revenue, orders, rating'),
  ],
  getRestaurantPerformanceAnalyticsController
);

/**
 * @route   GET /api/v1/admin/logs
 * @desc    Get admin logs
 * @access  Private (Admin only)
 */
router.get(
  '/logs',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('adminId')
      .optional()
      .isUUID()
      .withMessage('Valid admin ID is required'),
    query('action')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Action must be between 1 and 50 characters'),
    query('resourceType')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Resource type must be between 1 and 50 characters'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ],
  getAdminLogsController
);

export default router;