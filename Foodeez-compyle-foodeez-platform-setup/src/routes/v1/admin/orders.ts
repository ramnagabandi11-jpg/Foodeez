import { Router } from 'express';
import {
  listOrders,
  getOrderDetails,
  interveneOrder,
  reassignDelivery,
  processRefund,
} from '@/controllers/admin/orderAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'support', 'area_manager']));

// List all orders with filters
router.get(
  '/',
  [
    query('status').optional().isIn([
      'pending',
      'restaurant_accepted',
      'preparing',
      'ready_for_pickup',
      'driver_assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled_by_customer',
      'cancelled_by_restaurant',
      'cancelled_by_admin',
    ]),
    query('customerId').optional().isUUID(),
    query('restaurantId').optional().isUUID(),
    query('deliveryPartnerId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listOrders
);

// Get order details
router.get('/:id', [param('id').isUUID(), validate], getOrderDetails);

// Manually update order status
router.put(
  '/:id/intervene',
  authorize(['super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('newStatus').isIn([
      'pending',
      'restaurant_accepted',
      'preparing',
      'ready_for_pickup',
      'driver_assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled_by_customer',
      'cancelled_by_restaurant',
      'cancelled_by_admin',
    ]),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  interveneOrder
);

// Reassign delivery partner
router.post(
  '/:id/reassign-delivery',
  authorize(['super_admin', 'manager', 'area_manager']),
  [
    param('id').isUUID(),
    body('newDeliveryPartnerId').isUUID(),
    validate,
  ],
  reassignDelivery
);

// Process refund
router.post(
  '/:id/refund',
  authorize(['super_admin', 'manager', 'finance']),
  [
    param('id').isUUID(),
    body('refundAmount').isFloat({ min: 0 }),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  processRefund
);

export default router;
