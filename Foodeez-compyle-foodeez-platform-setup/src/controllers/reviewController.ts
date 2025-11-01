import { Request, Response, NextFunction } from 'express';
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
