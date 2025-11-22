import { Router } from 'express';
<<<<<<< HEAD
import { body, param, query } from 'express-validator';
import {
  createReviewController,
  getRestaurantReviewsController,
  getCustomerReviewsController,
  updateReviewController,
  deleteReviewController,
  getRestaurantRatingSummaryController,
  getAllReviewsController,
  uploadReviewPhotosController,
} from '@/controllers/reviewController';
import { authenticateToken } from '@/middleware/auth';
import { uploadReviewPhotos } from '@/middleware/upload';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review for an order
 * @access  Private (Customer only)
 */
router.post(
  '/',
  [
    body('orderId')
      .isUUID()
      .withMessage('Valid order ID is required'),
    body('restaurantId')
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
    body('deliveryPartnerId')
      .optional()
      .isUUID()
      .withMessage('Valid delivery partner ID is required'),
    body('restaurantRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Restaurant rating must be between 1 and 5'),
    body('foodRating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Food rating must be between 1 and 5'),
    body('deliveryRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Delivery rating must be between 1 and 5'),
    body('reviewText')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Review text cannot exceed 2000 characters'),
    body('reviewImages')
      .optional()
      .isArray()
      .withMessage('Review images must be an array'),
    body('reviewImages.*')
      .optional()
      .isURL()
      .withMessage('Each review image must be a valid URL'),
  ],
  createReviewController
);

/**
 * @route   GET /api/v1/reviews/restaurant/:restaurantId
 * @desc    Get all reviews for a restaurant
 * @access  Public
 */
router.get(
  '/restaurant/:restaurantId',
  [
    param('restaurantId')
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('sortBy')
      .optional()
      .isIn(['newest', 'oldest', 'highest', 'lowest'])
      .withMessage('Sort by must be one of: newest, oldest, highest, lowest'),
    query('withPhotos')
      .optional()
      .isBoolean()
      .withMessage('With photos must be a boolean'),
  ],
  getRestaurantReviewsController
);

/**
 * @route   GET /api/v1/reviews/customer/:userId
 * @desc    Get reviews by a customer
 * @access  Private (Own reviews or admin)
 */
router.get(
  '/customer/:userId',
  [
    param('userId')
      .isUUID()
      .withMessage('Valid user ID is required'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('restaurantId')
      .optional()
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
  ],
  getCustomerReviewsController
);

/**
 * @route   PUT /api/v1/reviews/:reviewId
 * @desc    Update a review
 * @access  Private (Own review only)
 */
router.put(
  '/:reviewId',
  [
    param('reviewId')
      .isUUID()
      .withMessage('Valid review ID is required'),
    body('restaurantRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Restaurant rating must be between 1 and 5'),
    body('foodRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Food rating must be between 1 and 5'),
    body('deliveryRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Delivery rating must be between 1 and 5'),
    body('reviewText')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Review text cannot exceed 2000 characters'),
    body('reviewImages')
      .optional()
      .isArray()
      .withMessage('Review images must be an array'),
    body('reviewImages.*')
      .optional()
      .isURL()
      .withMessage('Each review image must be a valid URL'),
  ],
  updateReviewController
);

/**
 * @route   DELETE /api/v1/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private (Own review only)
 */
router.delete(
  '/:reviewId',
  [
    param('reviewId')
      .isUUID()
      .withMessage('Valid review ID is required'),
  ],
  deleteReviewController
);

/**
 * @route   GET /api/v1/reviews/restaurant/:restaurantId/rating-summary
 * @desc    Get rating summary for a restaurant
 * @access  Public
 */
router.get(
  '/restaurant/:restaurantId/rating-summary',
  [
    param('restaurantId')
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
  ],
  getRestaurantRatingSummaryController
);

/**
 * @route   GET /api/v1/reviews/admin/all
 * @desc    Get all reviews with filters (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/admin/all',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating filter must be between 1 and 5'),
    query('restaurantId')
      .optional()
      .isUUID()
      .withMessage('Valid restaurant ID is required'),
    query('customerId')
      .optional()
      .isUUID()
      .withMessage('Valid customer ID is required'),
    query('isVisible')
      .optional()
      .isBoolean()
      .withMessage('Is visible must be a boolean'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
  ],
  getAllReviewsController
);

/**
 * @route   POST /api/v1/reviews/upload-photos
 * @desc    Upload review photos
 * @access  Private (Customer only)
 */
router.post(
  '/upload-photos',
  uploadReviewPhotos.array('photos', 5),
  uploadReviewPhotosController
);

export default router;
=======
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
>>>>>>> origin/compyle/foodeez-platform
