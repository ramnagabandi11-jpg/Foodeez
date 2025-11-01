import { Router } from 'express';
import { body, param } from 'express-validator';
import * as orderController from '@/controllers/orderController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

/**
 * POST /v1/orders
 * Create new order
 */
router.post(
  '/',
  authenticate,
  authorize('customer'),
  [
    body('restaurantId').isUUID().withMessage('Invalid restaurant ID'),
    body('deliveryAddressId').isUUID().withMessage('Invalid address ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('paymentMethod')
      .isIn(['razorpay', 'paytm', 'wallet', 'cod'])
      .withMessage('Invalid payment method'),
    body('promoCode').optional().isString(),
    body('loyaltyPointsUsed').optional().isInt({ min: 0 }),
    body('specialInstructions').optional().isString(),
    body('isPremiumDelivery').optional().isBoolean(),
    validate,
  ],
  orderController.createOrder
);

/**
 * GET /v1/orders/:id
 * Get order details
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('Invalid order ID'), validate],
  orderController.getOrder
);

/**
 * GET /v1/orders
 * Get customer orders
 */
router.get(
  '/',
  authenticate,
  authorize('customer'),
  orderController.getCustomerOrders
);

/**
 * PUT /v1/orders/:id/status
 * Update order status
 */
router.put(
  '/:id/status',
  authenticate,
  authorize('restaurant', 'delivery_partner', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('status').notEmpty().withMessage('Status is required'),
    validate,
  ],
  orderController.updateOrderStatus
);

/**
 * PUT /v1/orders/:id/cancel
 * Cancel order
 */
router.put(
  '/:id/cancel',
  authenticate,
  authorize('customer'),
  [
    param('id').isUUID().withMessage('Invalid order ID'),
    body('reason').notEmpty().withMessage('Cancellation reason is required'),
    validate,
  ],
  orderController.cancelOrder
);

export default router;
