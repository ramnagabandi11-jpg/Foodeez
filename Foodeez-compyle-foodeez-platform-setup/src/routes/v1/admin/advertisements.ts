import { Router } from 'express';
import {
  listAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  getAdvertisementStats,
  getAdvertisementOverview,
} from '@/controllers/admin/advertisementsAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'support']));

// List all advertisements
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'inactive']),
    query('type').optional().isIn(['banner', 'popup', 'restaurant_spotlight', 'promo_banner']),
    query('targetAudience').optional().isIn(['all', 'customers', 'restaurants', 'delivery_partners']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listAdvertisements
);

// Create new advertisement
router.post(
  '/',
  authorize(['super_admin', 'manager']),
  [
    body('title').isString().trim().isLength({ min: 2, max: 200 }),
    body('description').isString().trim().isLength({ min: 10, max: 1000 }),
    body('imageUrl').isURL(),
    body('type').isIn(['banner', 'popup', 'restaurant_spotlight', 'promo_banner']),
    body('targetAudience').isIn(['all', 'customers', 'restaurants', 'delivery_partners']),
    body('targeting').optional().isObject(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('isActive').optional().isBoolean(),
    body('priority').optional().isInt({ min: 1, max: 10 }),
    body('ctaText').optional().isString().trim().isLength({ max: 100 }),
    body('ctaLink').optional().isURL(),
    body('budget').optional().isFloat({ min: 0 }),
    validate,
  ],
  createAdvertisement
);

// Update advertisement
router.put(
  '/:id',
  authorize(['super_admin', 'manager']),
  [
    param('id').isString().trim().matches(/^ad-/),
    body('title').optional().isString().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isString().trim().isLength({ min: 10, max: 1000 }),
    body('imageUrl').optional().isURL(),
    body('type').optional().isIn(['banner', 'popup', 'restaurant_spotlight', 'promo_banner']),
    body('targetAudience').optional().isIn(['all', 'customers', 'restaurants', 'delivery_partners']),
    body('targeting').optional().isObject(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
    body('priority').optional().isInt({ min: 1, max: 10 }),
    body('ctaText').optional().isString().trim().isLength({ max: 100 }),
    body('ctaLink').optional().isURL(),
    body('budget').optional().isFloat({ min: 0 }),
    validate,
  ],
  updateAdvertisement
);

// Get advertisement statistics
router.get(
  '/:id/stats',
  [param('id').isString().trim().matches(/^ad-/), validate],
  getAdvertisementStats
);

// Advertisement overview dashboard
router.get(
  '/overview/dashboard',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getAdvertisementOverview
);

export default router;
