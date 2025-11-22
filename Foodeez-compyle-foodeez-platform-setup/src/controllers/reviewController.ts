import { Request, Response, NextFunction } from 'express';
<<<<<<< HEAD
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
=======
import { RatingReview, Order, Customer, Restaurant, User } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// POST /v1/reviews - Submit review for completed order
export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId, restaurantRating, deliveryRating, foodQuality, comment, images } = req.body;

    // Get customer
    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get order and verify it belongs to this customer
    const order = await Order.findOne({
      where: {
        id: orderId,
        customerId: customer.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify order is delivered
    if (order.status !== 'delivered') {
      throw new AppError('Can only review delivered orders', 400);
    }

    // Check if review already exists
    const existingReview = await RatingReview.findOne({
      where: { orderId },
    });

    if (existingReview) {
      throw new AppError('Review already submitted for this order', 400);
    }

    // Create review
    const review = await RatingReview.create({
      orderId,
      customerId: customer.id,
      restaurantId: order.restaurantId,
      deliveryPartnerId: order.deliveryPartnerId,
      restaurantRating,
      deliveryRating,
      foodQuality,
      comment,
      images: images || [],
    });

    // Update restaurant average rating
    await updateRestaurantRating(order.restaurantId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update restaurant average rating
async function updateRestaurantRating(restaurantId: string) {
  const reviews = await RatingReview.findAll({
    where: { restaurantId },
    attributes: ['restaurantRating'],
  });

  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, review) => sum + review.restaurantRating, 0) / reviews.length;
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (restaurant) {
      restaurant.rating = parseFloat(avgRating.toFixed(2));
      restaurant.totalRatings = reviews.length;
      await restaurant.save();
    }
  }
}

// GET /v1/reviews/restaurant/:restaurantId - Get reviews for restaurant
export const getRestaurantReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const orderClause: any[] = [];
    if (sortBy === 'recent') {
      orderClause.push(['createdAt', 'DESC']);
    } else if (sortBy === 'rating') {
      orderClause.push(['restaurantRating', 'DESC']);
    }

    const { count, rows: reviews } = await RatingReview.findAndCountAll({
      where: {
        restaurantId,
        isDeleted: false,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name'], // Only name, not full details
            },
          ],
        },
      ],
      order: orderClause,
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/reviews/my - Get customer's submitted reviews
export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await RatingReview.findAndCountAll({
      where: {
        customerId: customer.id,
        isDeleted: false,
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/reviews/:reviewId - Update review
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { restaurantRating, deliveryRating, foodQuality, comment } = req.body;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const review = await RatingReview.findOne({
      where: {
        id: reviewId,
        customerId: customer.id,
      },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['deliveredAt'],
        },
      ],
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if within 24 hours of delivery
    const order = review.get('order') as any;
    const hoursSinceDelivery = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceDelivery > 24) {
      throw new AppError('Can only update review within 24 hours of delivery', 400);
    }

    // Update fields
    if (restaurantRating !== undefined) review.restaurantRating = restaurantRating;
    if (deliveryRating !== undefined) review.deliveryRating = deliveryRating;
    if (foodQuality !== undefined) review.foodQuality = foodQuality;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update restaurant average rating
    await updateRestaurantRating(review.restaurantId);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/reviews/:reviewId - Delete review (soft delete)
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;

    // Check if user is customer or admin
    const customer = await Customer.findOne({ where: { userId } });
    const user = await User.findByPk(userId);

    const review = await RatingReview.findByPk(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Customer can only delete own reviews, admin can delete any
    if (customer) {
      if (review.customerId !== customer.id) {
        throw new AppError('Unauthorized to delete this review', 403);
      }
    } else if (user?.role !== 'admin') {
      throw new AppError('Unauthorized to delete reviews', 403);
    }

    // Soft delete
    review.isDeleted = true;
    await review.save();

    // Update restaurant average rating
    await updateRestaurantRating(review.restaurantId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
>>>>>>> origin/compyle/foodeez-platform
