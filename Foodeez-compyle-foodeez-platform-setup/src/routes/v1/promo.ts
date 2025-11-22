import { Router } from 'express';
import {
  getAvailablePromos,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  deactivatePromoCode,
  getPromoUsageStats,
} from '@/controllers/promoController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// Customer routes
router.get(
  '/available',
  authenticate,
  authorize(['customer']),
  getAvailablePromos
);

router.post(
  '/validate',
  authenticate,
  authorize(['customer']),
  [
    body('code').isString().trim().isLength({ min: 3, max: 50 }),
    body('restaurantId').isUUID(),
    body('orderAmount').isFloat({ min: 0 }),
    validate,
  ],
  validatePromoCode
);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize(['admin', 'super_admin', 'manager']),
  [
    body('code').isString().trim().isLength({ min: 3, max: 50 }),
    body('discountType').isIn(['percentage', 'fixed']),
    body('discountValue').isFloat({ min: 0 }),
    body('minOrderValue').optional().isFloat({ min: 0 }),
    body('maxDiscountAmount').optional().isFloat({ min: 0 }),
    body('validFrom').isISO8601(),
    body('validTo').isISO8601(),
    body('usageLimit').optional().isInt({ min: 1 }),
    body('maxUsageCount').optional().isInt({ min: 1 }),
    body('applicableFor').optional().isIn(['all', 'first_order', 'specific_restaurant']),
    body('applicableRestaurantIds').optional().isArray(),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  createPromoCode
);

router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('discountType').optional().isIn(['percentage', 'fixed']),
    body('discountValue').optional().isFloat({ min: 0 }),
    body('minOrderValue').optional().isFloat({ min: 0 }),
    body('maxDiscountAmount').optional().isFloat({ min: 0 }),
    body('validFrom').optional().isISO8601(),
    body('validTo').optional().isISO8601(),
    body('usageLimit').optional().isInt({ min: 1 }),
    body('maxUsageCount').optional().isInt({ min: 1 }),
    body('applicableFor').optional().isIn(['all', 'first_order', 'specific_restaurant']),
    body('applicableRestaurantIds').optional().isArray(),
    body('description').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updatePromoCode
);

router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin', 'manager']),
  [
    param('id').isUUID(),
    validate,
  ],
  deactivatePromoCode
);

router.get(
  '/:id/usage',
  authenticate,
  authorize(['admin', 'super_admin', 'manager', 'finance']),
  [
    param('id').isUUID(),
    validate,
  ],
  getPromoUsageStats
);

export default router;
