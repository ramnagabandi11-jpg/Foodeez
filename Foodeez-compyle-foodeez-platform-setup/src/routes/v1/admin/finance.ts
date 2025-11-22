import { Router } from 'express';
import {
  getSubscriptionBilling,
  getDailySettlements,
  getDeliveryEarnings,
  getTransactionHistory,
  processManualPayout,
  reconcileWallet,
  getRefundHistory,
  getPaymentGatewayReports,
} from '@/controllers/admin/financeAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication with finance role
router.use(authenticate, authorize(['super_admin', 'finance', 'manager']));

// View tiered subscription billing
router.get(
  '/subscriptions',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('restaurantId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getSubscriptionBilling
);

// Daily settlements for restaurants
router.get(
  '/settlements',
  [
    query('date').optional().isISO8601(),
    query('restaurantId').optional().isUUID(),
    query('status').optional().isIn(['pending', 'processed', 'failed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getDailySettlements
);

// Delivery partner earnings
router.get(
  '/delivery-earnings',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('deliveryPartnerId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getDeliveryEarnings
);

// Transaction history
router.get(
  '/transactions',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('transactionType').optional().isIn([
      'credit',
      'debit',
      'refund',
      'payout',
      'adjustment',
      'commission',
      'subscription',
      'compensation',
      'deduction',
    ]),
    query('userId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getTransactionHistory
);

// Process manual payout
router.post(
  '/manual-payout',
  authorize(['super_admin', 'finance']),
  [
    body('userId').isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('payoutMethod').isIn(['upi', 'bank_transfer', 'cash']),
    body('upiId').optional().isString().trim(),
    body('bankAccount').optional().isObject(),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  processManualPayout
);

// Reconcile wallet balance
router.post(
  '/reconcile-wallet',
  authorize(['super_admin', 'finance']),
  [
    body('userId').isUUID(),
    body('expectedBalance').isFloat(),
    body('actualBalance').isFloat(),
    body('adjustmentReason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  reconcileWallet
);

// Refund history
router.get(
  '/refunds',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('customerId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getRefundHistory
);

// Payment gateway reports
router.get(
  '/payment-gateway',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['pending', 'success', 'failed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getPaymentGatewayReports
);

export default router;
