import { Router } from 'express';
import {
  submitReview,
  getRestaurantReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from '@/controllers/reviewController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// Submit review - requires customer authentication
router.post(
  '/',
  authenticate,
  authorize(['customer']),
  [
    body('orderId').isUUID(),
    body('restaurantRating').isInt({ min: 1, max: 5 }),
    body('deliveryRating').isInt({ min: 1, max: 5 }),
    body('foodQuality').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().trim().isLength({ max: 1000 }),
    body('images').optional().isArray(),
    validate,
  ],
  submitReview
);

// Get restaurant reviews - public (no auth required)
router.get('/restaurant/:restaurantId', getRestaurantReviews);

// Get my reviews - requires customer authentication
router.get(
  '/my',
  authenticate,
  authorize(['customer']),
  getMyReviews
);

// Update review - requires customer authentication
router.put(
  '/:reviewId',
  authenticate,
  authorize(['customer']),
  [
    param('reviewId').isUUID(),
    body('restaurantRating').optional().isInt({ min: 1, max: 5 }),
    body('deliveryRating').optional().isInt({ min: 1, max: 5 }),
    body('foodQuality').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().isString().trim().isLength({ max: 1000 }),
    validate,
  ],
  updateReview
);

// Delete review - requires customer or admin authentication
router.delete(
  '/:reviewId',
  authenticate,
  authorize(['customer', 'admin']),
  [
    param('reviewId').isUUID(),
    validate,
  ],
  deleteReview
);

export default router;
