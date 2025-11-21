import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCode } from '@/utils/constants';
import {
  createReview,
  getRestaurantReviews,
  getCustomerReviews,
  updateReview,
  deleteReview,
  getRestaurantRatingSummary,
  getAllReviews,
} from '@/services/reviewService';
import { asyncHandler } from '@/middleware/asyncHandler';

/**
 * Create a new review
 */
export const createReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const {
    orderId,
    restaurantId,
    deliveryPartnerId,
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages,
  } = req.body;

  const customerId = req.user?.userId;
  if (!customerId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Customer ID not found',
    });
  }

  const review = await createReview({
    orderId,
    customerId,
    restaurantId,
    deliveryPartnerId,
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages,
  });

  res.status(StatusCode.CREATED).json({
    success: true,
    message: 'Review created successfully',
    data: review,
  });
});

/**
 * Get all reviews for a restaurant
 */
export const getRestaurantReviewsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { restaurantId } = req.params;
  const {
    page = 1,
    limit = 20,
    rating,
    sortBy = 'newest',
    withPhotos = 'false',
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    rating: rating ? parseInt(rating as string) : undefined,
    sortBy: sortBy as 'newest' | 'oldest' | 'highest' | 'lowest',
    withPhotos: withPhotos === 'true',
  };

  const result = await getRestaurantReviews(restaurantId, options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Restaurant reviews retrieved successfully',
    data: result,
  });
});

/**
 * Get customer's reviews
 */
export const getCustomerReviewsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 20,
    restaurantId,
  } = req.query;

  // Allow users to view their own reviews or admin to view any user's reviews
  if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
    return res.status(StatusCode.FORBIDDEN).json({
      success: false,
      message: 'Access denied',
    });
  }

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    restaurantId: restaurantId as string | undefined,
  };

  const result = await getCustomerReviews(userId, options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Customer reviews retrieved successfully',
    data: result,
  });
});

/**
 * Update a review
 */
export const updateReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { reviewId } = req.params;
  const {
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages,
  } = req.body;

  const customerId = req.user?.userId;
  if (!customerId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Customer ID not found',
    });
  }

  const review = await updateReview(reviewId, customerId, {
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages,
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Review updated successfully',
    data: review,
  });
});

/**
 * Delete a review
 */
export const deleteReviewController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { reviewId } = req.params;

  const customerId = req.user?.userId;
  if (!customerId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Customer ID not found',
    });
  }

  await deleteReview(reviewId, customerId);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

/**
 * Get rating summary for a restaurant
 */
export const getRestaurantRatingSummaryController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { restaurantId } = req.params;

  const ratingSummary = await getRestaurantRatingSummary(restaurantId);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Restaurant rating summary retrieved successfully',
    data: ratingSummary,
  });
});

/**
 * Get all reviews (admin only)
 */
export const getAllReviewsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(StatusCode.FORBIDDEN).json({
      success: false,
      message: 'Admin access required',
    });
  }

  const {
    page = 1,
    limit = 20,
    rating,
    restaurantId,
    customerId,
    isVisible,
    startDate,
    endDate,
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    rating: rating ? parseInt(rating as string) : undefined,
    restaurantId: restaurantId as string | undefined,
    customerId: customerId as string | undefined,
    isVisible: isVisible !== undefined ? isVisible === 'true' : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await getAllReviews(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'All reviews retrieved successfully',
    data: result,
  });
});

/**
 * Upload review photos
 */
export const uploadReviewPhotosController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: 'No photos uploaded',
    });
  }

  // Generate URLs for uploaded files
  const photoUrls = files.map((file) => {
    return `/uploads/reviews/${file.filename}`;
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Photos uploaded successfully',
    data: {
      photoUrls,
      count: photoUrls.length,
    },
  });
});

export default {
  createReviewController,
  getRestaurantReviewsController,
  getCustomerReviewsController,
  updateReviewController,
  deleteReviewController,
  getRestaurantRatingSummaryController,
  getAllReviewsController,
  uploadReviewPhotosController,
};