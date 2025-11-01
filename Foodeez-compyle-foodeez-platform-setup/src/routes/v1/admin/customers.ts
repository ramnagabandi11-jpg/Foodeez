import { Router } from 'express';
import {
  listCustomers,
  getCustomerDetails,
  updateCustomerStatus,
  adjustWalletBalance,
  adjustLoyaltyPoints,
} from '@/controllers/admin/customerAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'support']));

router.get('/', listCustomers);

router.get('/:id', [param('id').isUUID(), validate], getCustomerDetails);

router.patch(
  '/:id/status',
  authorize(['super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('isActive').isBoolean(),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updateCustomerStatus
);

router.post(
  '/:id/wallet/adjust',
  authorize(['super_admin', 'finance', 'support']),
  [
    param('id').isUUID(),
    body('amount').isFloat(),
    body('transactionType').isIn(['refund', 'compensation', 'deduction', 'adjustment']),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  adjustWalletBalance
);

router.post(
  '/:id/loyalty/adjust',
  authorize(['super_admin', 'manager', 'support']),
  [
    param('id').isUUID(),
    body('points').isInt(),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  adjustLoyaltyPoints
);

export default router;
