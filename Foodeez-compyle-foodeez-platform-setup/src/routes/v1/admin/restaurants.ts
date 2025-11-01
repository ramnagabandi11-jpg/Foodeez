import { Router } from 'express';
import {
  listRestaurants,
  getRestaurantDetails,
  registerRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
  waiveSubscriptionFee,
  getRestaurantAnalytics,
} from '@/controllers/admin/restaurantAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All admin restaurant routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'area_manager']));

// List restaurants
router.get('/', listRestaurants);

// Get restaurant details
router.get('/:id', [param('id').isUUID(), validate], getRestaurantDetails);

// Register new restaurant
router.post(
  '/',
  authorize(['super_admin', 'manager']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 200 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone('en-IN'),
    body('password').isString().isLength({ min: 8 }),
    body('restaurantName').isString().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isString().trim().isLength({ max: 1000 }),
    body('address').isString().trim().isLength({ max: 500 }),
    body('city').isString().trim().isLength({ min: 2, max: 100 }),
    body('state').isString().trim().isLength({ min: 2, max: 100 }),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('cuisineTypes').optional().isArray(),
    body('openingTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('closingTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('logo').optional().isURL(),
    validate,
  ],
  registerRestaurant
);

// Update restaurant
router.put(
  '/:id',
  authorize(['super_admin', 'manager']),
  [param('id').isUUID(), validate],
  updateRestaurant
);

// Update restaurant status
router.patch(
  '/:id/status',
  authorize(['super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('status').isIn(['active', 'suspended', 'closed']),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updateRestaurantStatus
);

// Waive subscription fee
router.post(
  '/:id/subscription/waive',
  authorize(['super_admin', 'finance', 'manager']),
  [
    param('id').isUUID(),
    body('date').isISO8601(),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  waiveSubscriptionFee
);

// Get restaurant analytics
router.get('/:id/analytics', [param('id').isUUID(), validate], getRestaurantAnalytics);

export default router;
