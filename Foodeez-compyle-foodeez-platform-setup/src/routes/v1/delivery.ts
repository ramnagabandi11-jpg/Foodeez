import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateStatus,
  getAvailableOrders,
  acceptDelivery,
  markPickedUp,
  markDelivered,
  getActiveDelivery,
  getDeliveryHistory,
  getEarnings,
  getEarningsTransactions,
  getNavigation,
} from '@/controllers/deliveryController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All delivery routes require authentication with delivery_partner role
router.use(authenticate, authorize(['delivery_partner']));

// Profile routes
router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('vehicleType').optional().isString().isIn(['bike', 'scooter', 'bicycle', 'car']),
    body('vehicleNumber').optional().isString().trim().isLength({ min: 5, max: 20 }),
    body('aadharNumber').optional().isString().matches(/^\d{12}$/),
    body('bankDetails').optional().isObject(),
    body('photo').optional().isURL(),
    validate,
  ],
  updateProfile
);

// Status update
router.patch(
  '/status',
  [
    body('isOnline').isBoolean(),
    body('currentLatitude').optional().isFloat({ min: -90, max: 90 }),
    body('currentLongitude').optional().isFloat({ min: -180, max: 180 }),
    validate,
  ],
  updateStatus
);

// Available orders
router.get(
  '/available-orders',
  [
    query('latitude').isFloat({ min: -90, max: 90 }),
    query('longitude').isFloat({ min: -180, max: 180 }),
    validate,
  ],
  getAvailableOrders
);

// Order actions
router.post(
  '/orders/:orderId/accept',
  [
    param('orderId').isUUID(),
    validate,
  ],
  acceptDelivery
);

router.post(
  '/orders/:orderId/pickup',
  [
    param('orderId').isUUID(),
    body('otp').isString().isLength({ min: 4, max: 4 }),
    validate,
  ],
  markPickedUp
);

router.post(
  '/orders/:orderId/deliver',
  [
    param('orderId').isUUID(),
    body('otp').isString().isLength({ min: 4, max: 4 }),
    body('photo').optional().isURL(),
    validate,
  ],
  markDelivered
);

// Active and history
router.get('/orders/active', getActiveDelivery);

router.get('/orders/history', getDeliveryHistory);

// Earnings
router.get('/earnings', getEarnings);

router.get('/earnings/transactions', getEarningsTransactions);

// Navigation
router.get(
  '/navigation/:orderId',
  [
    param('orderId').isUUID(),
    validate,
  ],
  getNavigation
);

export default router;
