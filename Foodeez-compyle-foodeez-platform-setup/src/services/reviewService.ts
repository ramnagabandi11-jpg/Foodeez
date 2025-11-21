import { Op, fn, col, literal } from 'sequelize';
import { RatingReview, RatingSummary, Order, Customer, Restaurant } from '@/models/postgres';
import { NotFoundError, ValidationError, ConflictError } from '@/utils/errors';
import { emitOrderStatusUpdate, emitNewOrderToRestaurant } from '@/sockets';

/**
 * Create a new review for an order
 */
export const createReview = async (data: {
  orderId: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string;
  restaurantRating: number;
  foodRating: number;
  deliveryRating?: number;
  reviewText?: string;
  reviewImages?: string[];
}): Promise<RatingReview> => {
  const {
    orderId,
    customerId,
    restaurantId,
    deliveryPartnerId,
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages = [],
  } = data;

  // Validate that the order exists and belongs to the customer
  const order = await Order.findOne({
    where: { id: orderId, customerId },
  });

  if (!order) {
    throw new NotFoundError('Order not found or does not belong to customer');
  }

  // Check if order is delivered (only delivered orders can be reviewed)
  if (order.status !== 'delivered') {
    throw new ValidationError('Only delivered orders can be reviewed');
  }

  // Check if order was delivered within the last 7 days
  const deliveredAt = order.deliveredAt;
  if (!deliveredAt) {
    throw new ValidationError('Order delivery date not found');
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (deliveredAt < sevenDaysAgo) {
    throw new ValidationError('Reviews can only be created within 7 days of delivery');
  }

  // Check if review already exists for this order
  const existingReview = await RatingReview.findOne({
    where: { orderId },
  });

  if (existingReview) {
    throw new ConflictError('Review already exists for this order');
  }

  // Validate rating values
  if (restaurantRating < 1 || restaurantRating > 5) {
    throw new ValidationError('Restaurant rating must be between 1 and 5');
  }

  if (foodRating < 1 || foodRating > 5) {
    throw new ValidationError('Food rating must be between 1 and 5');
  }

  if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
    throw new ValidationError('Delivery rating must be between 1 and 5');
  }

  // Create the review
  const review = await RatingReview.create({
    orderId,
    customerId,
    restaurantId,
    deliveryPartnerId,
    restaurantRating,
    foodRating,
    deliveryRating,
    reviewText,
    reviewImages,
    isVerified: true, // Auto-verify since it's for a delivered order
    isVisible: true,
  });

  // Update rating summary
  await updateRatingSummary(restaurantId);

  // Emit real-time rating update
  emitOrderStatusUpdate(
    orderId,
    customerId,
    restaurantId,
    deliveryPartnerId || null,
    'review_added',
    { reviewId: review.id }
  );

  return review;
};

/**
 * Get all reviews for a restaurant with pagination
 */
export const getRestaurantReviews = async (
  restaurantId: string,
  options?: {
    page?: number;
    limit?: number;
    rating?: number;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
    withPhotos?: boolean;
  }
): Promise<{ reviews: RatingReview[]; total: number; averageRating: number }> => {
  const {
    page = 1,
    limit = 20,
    rating,
    sortBy = 'newest',
    withPhotos = false,
  } = options || {};

  const offset = (page - 1) * limit;
  const where: any = { restaurantId, isVisible: true };

  if (rating) {
    where.restaurantRating = rating;
  }

  if (withPhotos) {
    where.reviewImages = {
      [Op.ne]: [],
    };
  }

  let order: any[] = [];

  switch (sortBy) {
    case 'newest':
      order = [['createdAt', 'DESC']];
      break;
    case 'oldest':
      order = [['createdAt', 'ASC']];
      break;
    case 'highest':
      order = [['restaurantRating', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'lowest':
      order = [['restaurantRating', 'ASC'], ['createdAt', 'DESC']];
      break;
  }

  const { count, rows } = await RatingReview.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [
          {
            model: Restaurant,
            as: 'restaurant',
            attributes: ['name'],
          },
        ],
        attributes: ['id'],
      },
    ],
    limit,
    offset,
    order,
  });

  // Get average rating
  const ratingSummary = await RatingSummary.findOne({
    where: { restaurantId },
  });

  const averageRating = ratingSummary?.averageRating || 0;

  return { reviews: rows, total: count, averageRating };
};

/**
 * Get reviews by a customer
 */
export const getCustomerReviews = async (
  customerId: string,
  options?: {
    page?: number;
    limit?: number;
    restaurantId?: string;
  }
): Promise<{ reviews: RatingReview[]; total: number }> => {
  const { page = 1, limit = 20, restaurantId } = options || {};
  const offset = (page - 1) * limit;

  const where: any = { customerId };

  if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  const { count, rows } = await RatingReview.findAndCountAll({
    where,
    include: [
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'logoImageUrl'],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { reviews: rows, total: count };
};

/**
 * Update a review (only within 24 hours of creation)
 */
export const updateReview = async (
  reviewId: string,
  customerId: string,
  data: {
    restaurantRating?: number;
    foodRating?: number;
    deliveryRating?: number;
    reviewText?: string;
    reviewImages?: string[];
  }
): Promise<RatingReview> => {
  const review = await RatingReview.findOne({
    where: { id: reviewId, customerId },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Check if review was created within the last 24 hours
  const createdAt = review.createdAt;
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  if (createdAt < twentyFourHoursAgo) {
    throw new ValidationError('Reviews can only be updated within 24 hours of creation');
  }

  // Validate rating values if provided
  if (data.restaurantRating !== undefined && (data.restaurantRating < 1 || data.restaurantRating > 5)) {
    throw new ValidationError('Restaurant rating must be between 1 and 5');
  }

  if (data.foodRating !== undefined && (data.foodRating < 1 || data.foodRating > 5)) {
    throw new ValidationError('Food rating must be between 1 and 5');
  }

  if (data.deliveryRating !== undefined && (data.deliveryRating < 1 || data.deliveryRating > 5)) {
    throw new ValidationError('Delivery rating must be between 1 and 5');
  }

  // Update the review
  await review.update(data);

  // Update rating summary
  await updateRatingSummary(review.restaurantId);

  return review;
};

/**
 * Delete a review (own review only, within 24 hours)
 */
export const deleteReview = async (reviewId: string, customerId: string): Promise<void> => {
  const review = await RatingReview.findOne({
    where: { id: reviewId, customerId },
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  // Check if review was created within the last 24 hours
  const createdAt = review.createdAt;
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  if (createdAt < twentyFourHoursAgo) {
    throw new ValidationError('Reviews can only be deleted within 24 hours of creation');
  }

  const restaurantId = review.restaurantId;

  // Delete the review
  await review.destroy();

  // Update rating summary
  await updateRatingSummary(restaurantId);
};

/**
 * Get rating summary for a restaurant
 */
export const getRestaurantRatingSummary = async (restaurantId: string) => {
  const ratingSummary = await RatingSummary.findOne({
    where: { restaurantId },
  });

  if (!ratingSummary) {
    // Create rating summary if it doesn't exist
    return await createRatingSummary(restaurantId);
  }

  return ratingSummary;
};

/**
 * Update or create rating summary for a restaurant
 */
export const updateRatingSummary = async (restaurantId: string): Promise<RatingSummary> => {
  // Get all visible reviews for the restaurant
  const reviews = await RatingReview.findAll({
    where: { restaurantId, isVisible: true },
    attributes: [
      'restaurantRating',
      'foodRating',
      'deliveryRating',
    ],
  });

  // Calculate weighted average
  let totalRating = 0;
  let ratingCount = 0;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    // Calculate average rating for this review (restaurant + food + delivery if available)
    let reviewAverage = (review.restaurantRating + review.foodRating) / 2;
    if (review.deliveryRating) {
      reviewAverage = (review.restaurantRating + review.foodRating + review.deliveryRating) / 3;
    }

    totalRating += reviewAverage;
    ratingCount++;

    // Update distribution (using restaurant rating)
    const roundedRating = Math.round(review.restaurantRating);
    ratingDistribution[roundedRating as keyof typeof ratingDistribution]++;
  });

  const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Find or create rating summary
  const [ratingSummary, created] = await RatingSummary.findOrCreate({
    where: { restaurantId },
    defaults: {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: ratingCount,
      ratingDistribution,
      lastUpdated: new Date(),
    },
  });

  if (!created) {
    await ratingSummary.update({
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: ratingCount,
      ratingDistribution,
      lastUpdated: new Date(),
    });
  }

  // Update restaurant's average rating and total ratings
  await Restaurant.update(
    {
      averageRating: ratingSummary.averageRating,
      totalRatings: ratingSummary.totalReviews,
    },
    { where: { id: restaurantId } }
  );

  return ratingSummary;
};

/**
 * Create initial rating summary for a restaurant
 */
export const createRatingSummary = async (restaurantId: string): Promise<RatingSummary> => {
  return await RatingSummary.create({
    restaurantId,
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    lastUpdated: new Date(),
  });
};

/**
 * Get all reviews with pagination (for admin)
 */
export const getAllReviews = async (options?: {
  page?: number;
  limit?: number;
  rating?: number;
  restaurantId?: string;
  customerId?: string;
  isVisible?: boolean;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ reviews: RatingReview[]; total: number }> => {
  const {
    page = 1,
    limit = 20,
    rating,
    restaurantId,
    customerId,
    isVisible,
    startDate,
    endDate,
  } = options || {};

  const offset = (page - 1) * limit;
  const where: any = {};

  if (rating) {
    where.restaurantRating = rating;
  }

  if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (isVisible !== undefined) {
    where.isVisible = isVisible;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt[Op.gte] = startDate;
    }
    if (endDate) {
      where.createdAt[Op.lte] = endDate;
    }
  }

  const { count, rows } = await RatingReview.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [
          {
            model: Restaurant,
            as: 'restaurant',
            attributes: ['id', 'name'],
          },
        ],
        attributes: ['id'],
      },
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'logoImageUrl'],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { reviews: rows, total: count };
};

export default {
  createReview,
  getRestaurantReviews,
  getCustomerReviews,
  updateReview,
  deleteReview,
  getRestaurantRatingSummary,
  updateRatingSummary,
  createRatingSummary,
  getAllReviews,
};