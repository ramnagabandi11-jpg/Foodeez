import { Router } from 'express';
import {
  getPlatformOverview,
  getOrderTrends,
  getRestaurantPerformance,
  getDeliveryPerformance,
  getCustomerInsights,
  getRevenueBreakdown,
} from '@/controllers/admin/analyticsAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'area_manager']));

// Platform overview dashboard
router.get(
  '/overview',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getPlatformOverview
);

// Order trends over time
router.get(
  '/order-trends',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']),
    validate,
  ],
  getOrderTrends
);

// Restaurant performance metrics
router.get(
  '/restaurant-performance',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['revenue', 'orders', 'rating', 'cancellation']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getRestaurantPerformance
);

// Delivery partner performance
router.get(
  '/delivery-performance',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['deliveries', 'earnings', 'rating', 'speed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getDeliveryPerformance
);

// Customer behavior insights
router.get(
  '/customer-insights',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getCustomerInsights
);

// Revenue breakdown by category
router.get(
  '/revenue-breakdown',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getRevenueBreakdown
);

export default router;
