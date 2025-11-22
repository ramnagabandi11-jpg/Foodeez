import { Op, fn, col, literal } from 'sequelize';
import { User, Customer, Restaurant, DeliveryPartner, Order, RatingReview, AdminLog, AdminUser, Transaction } from '@/models/postgres';
import { NotFoundError, ValidationError, ConflictError } from '@/utils/errors';
import { emitOrderStatusUpdate, emitNewOrderToRestaurant } from '@/sockets';

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (options?: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ users: User[]; total: number }> => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    startDate,
    endDate,
  } = options || {};

  const offset = (page - 1) * limit;
  const where: any = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
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

  const { count, rows } = await User.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['totalOrders', 'loyaltyPoints'],
        required: false,
      },
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'averageRating', 'totalRatings'],
        required: false,
      },
      {
        model: DeliveryPartner,
        as: 'deliveryPartner',
        attributes: ['totalDeliveries', 'averageRating'],
        required: false,
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { users: rows, total: count };
};

/**
 * Activate or deactivate a user
 */
export const updateUserStatus = async (
  userId: string,
  adminId: string,
  data: {
    isActive: boolean;
    deactivationReason?: string;
  }
): Promise<User> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const oldValues = {
    isActive: user.isActive,
    deactivatedBy: user.deactivatedBy,
    deactivatedAt: user.deactivatedAt,
    deactivationReason: user.deactivationReason,
  };

  const newValues = {
    isActive: data.isActive,
    deactivatedBy: data.isActive ? null : adminId,
    deactivatedAt: data.isActive ? null : new Date(),
    deactivationReason: data.isActive ? null : data.deactivationReason,
  };

  // Update user status
  await user.update(newValues);

  // Log admin action
  await AdminLog.create({
    adminId,
    action: data.isActive ? 'activate_user' : 'deactivate_user',
    resourceType: 'user',
    resourceId: userId,
    oldValues,
    newValues,
    ipAddress: null, // Will be set by middleware
  });

  return user;
};

/**
 * Get pending restaurant approvals
 */
export const getPendingRestaurants = async (options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ restaurants: Restaurant[]; total: number }> => {
  const { page = 1, limit = 20, search } = options || {};
  const offset = (page - 1) * limit;

  const where: any = { isApproved: false };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { ownerName: { [Op.iLike]: `%${search}%` } },
      { ownerPhone: { [Op.iLike]: `%${search}%` } },
      { businessEmail: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Restaurant.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'phone', 'createdAt'],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { restaurants: rows, total: count };
};

/**
 * Approve or reject a restaurant
 */
export const approveOrRejectRestaurant = async (
  restaurantId: string,
  adminId: string,
  data: {
    isApproved: boolean;
    rejectionReason?: string;
  }
): Promise<Restaurant> => {
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  const oldValues = {
    isApproved: restaurant.get('isApproved') || false,
    approvedBy: restaurant.get('approvedBy'),
    approvedAt: restaurant.get('approvedAt'),
    rejectionReason: restaurant.get('rejectionReason'),
  };

  const newValues = {
    isApproved: data.isApproved,
    approvedBy: data.isApproved ? adminId : null,
    approvedAt: data.isApproved ? new Date() : null,
    rejectionReason: data.isApproved ? null : data.rejectionReason,
  };

  // Update restaurant approval status
  await restaurant.update(newValues);

  // Log admin action
  await AdminLog.create({
    adminId,
    action: data.isApproved ? 'approve_restaurant' : 'reject_restaurant',
    resourceType: 'restaurant',
    resourceId: restaurantId,
    oldValues,
    newValues,
    ipAddress: null, // Will be set by middleware
  });

  // Emit notification if approved
  if (data.isApproved) {
    emitOrderStatusUpdate(
      '', // No order ID
      restaurant.userId,
      restaurantId,
      null,
      'restaurant_approved',
      { restaurantId, restaurantName: restaurant.name }
    );
  }

  return restaurant;
};

/**
 * Get all orders with advanced filtering
 */
export const getAllOrders = async (options?: {
  page?: number;
  limit?: number;
  status?: string;
  restaurantId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}): Promise<{ orders: Order[]; total: number }> => {
  const {
    page = 1,
    limit = 20,
    status,
    restaurantId,
    customerId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  } = options || {};

  const offset = (page - 1) * limit;
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (restaurantId) {
    where.restaurantId = restaurantId;
  }

  if (customerId) {
    where.customerId = customerId;
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

  if (minAmount || maxAmount) {
    where.totalAmount = {};
    if (minAmount) {
      where.totalAmount[Op.gte] = minAmount;
    }
    if (maxAmount) {
      where.totalAmount[Op.lte] = maxAmount;
    }
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'email', 'phone'],
          },
        ],
      },
      {
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'averageRating'],
      },
      {
        model: DeliveryPartner,
        as: 'deliveryPartner',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'phone'],
          },
        ],
      },
      {
        model: RatingReview,
        as: 'review',
        attributes: ['restaurantRating', 'foodRating', 'deliveryRating'],
        required: false,
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { orders: rows, total: count };
};

/**
 * Get dashboard analytics
 */
export const getDashboardAnalytics = async () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [
    totalUsers,
    activeUsers,
    totalRestaurants,
    approvedRestaurants,
    pendingRestaurants,
    totalOrders,
    todayOrders,
    thirtyDayOrders,
    totalRevenue,
    thirtyDayRevenue,
    activeDeliveryPartners,
    averageRating,
  ] = await Promise.all([
    // Total users
    User.count(),
    // Active users
    User.count({ where: { isActive: true } }),
    // Total restaurants
    Restaurant.count(),
    // Approved restaurants
    Restaurant.count({ where: { isApproved: true } }),
    // Pending restaurants
    Restaurant.count({ where: { isApproved: false } }),
    // Total orders
    Order.count(),
    // Today's orders
    Order.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Last 30 days orders
    Order.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    }),
    // Total revenue
    Order.sum('totalAmount', {
      where: { status: 'delivered' },
    }) || 0,
    // Last 30 days revenue
    Order.sum('totalAmount', {
      where: {
        status: 'delivered',
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    }) || 0,
    // Active delivery partners
    DeliveryPartner.count({ where: { isAvailable: true } }),
    // Average platform rating
    RatingReview.findAll({
      attributes: [
        [fn('AVG', col('restaurantRating')), 'avgRestaurantRating'],
        [fn('AVG', col('foodRating')), 'avgFoodRating'],
      ],
      where: { isVisible: true },
    }),
  ]);

  const avgRating = averageRating.length > 0
    ? parseFloat(averageRating[0].dataValues.avgRestaurantRating) || 0
    : 0;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },
    restaurants: {
      total: totalRestaurants,
      approved: approvedRestaurants,
      pending: pendingRestaurants,
      rejected: totalRestaurants - approvedRestaurants - pendingRestaurants,
    },
    orders: {
      total: totalOrders,
      today: todayOrders,
      last30Days: thirtyDayOrders,
    },
    revenue: {
      total: Math.round(totalRevenue * 100) / 100,
      last30Days: Math.round(thirtyDayRevenue * 100) / 100,
    },
    delivery: {
      activePartners: activeDeliveryPartners,
    },
    ratings: {
      average: Math.round(avgRating * 100) / 100,
    },
  };
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly';
}) => {
  const {
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate = new Date(),
    period = 'daily',
  } = options || {};

  const revenueData = await Order.findAll({
    attributes: [
      [fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt')), 'period'],
      [fn('SUM', col('totalAmount')), 'revenue'],
      [fn('COUNT', col('id')), 'orderCount'],
    ],
    where: {
      status: 'delivered',
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    group: [fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt'))],
    order: [[fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt')), 'ASC']],
  });

  return revenueData.map((item: any) => ({
    period: item.dataValues.period,
    revenue: Math.round(item.dataValues.revenue * 100) / 100,
    orderCount: parseInt(item.dataValues.orderCount),
  }));
};

/**
 * Get user growth analytics
 */
export const getUserGrowthAnalytics = async (options?: {
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly';
}) => {
  const {
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate = new Date(),
    period = 'daily',
  } = options || {};

  const userData = await User.findAll({
    attributes: [
      [fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt')), 'period'],
      [fn('COUNT', col('id')), 'newUsers'],
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    group: [fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt'))],
    order: [[fn('DATE_TRUNC', period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day', col('createdAt')), 'ASC']],
  });

  return userData.map((item: any) => ({
    period: item.dataValues.period,
    newUsers: parseInt(item.dataValues.newUsers),
  }));
};

/**
 * Get restaurant performance analytics
 */
export const getRestaurantPerformanceAnalytics = async (options?: {
  limit?: number;
  sortBy?: 'revenue' | 'orders' | 'rating';
}) => {
  const { limit = 10, sortBy = 'revenue' } = options || {};

  let order: any[] = [];
  let include: any[] = [
    {
      model: User,
      as: 'user',
      attributes: ['name', 'email', 'createdAt'],
    },
  ];

  switch (sortBy) {
    case 'revenue':
      // This would require complex joins, simplified for now
      order = [['name', 'ASC']];
      break;
    case 'orders':
      // We'll need to add order count later
      order = [['name', 'ASC']];
      break;
    case 'rating':
      order = [['averageRating', 'DESC']];
      break;
  }

  const restaurants = await Restaurant.findAll({
    where: { isApproved: true },
    attributes: [
      'id',
      'name',
      'averageRating',
      'totalRatings',
      'city',
      'cuisineTypes',
      'createdAt',
    ],
    include,
    limit,
    order,
  });

  // Get order counts for each restaurant
  const restaurantsWithOrderCounts = await Promise.all(
    restaurants.map(async (restaurant) => {
      const orderCount = await Order.count({
        where: { restaurantId: restaurant.id, status: 'delivered' },
      });

      const totalRevenue = await Order.sum('totalAmount', {
        where: { restaurantId: restaurant.id, status: 'delivered' },
      }) || 0;

      return {
        ...restaurant.toJSON(),
        orderCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      };
    })
  );

  // Sort by the requested criteria
  restaurantsWithOrderCounts.sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'orders':
        return b.orderCount - a.orderCount;
      case 'rating':
        return b.averageRating - a.averageRating;
      default:
        return 0;
    }
  });

  return restaurantsWithOrderCounts.slice(0, limit);
};

/**
 * Get admin logs
 */
export const getAdminLogs = async (options?: {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: AdminLog[]; total: number }> => {
  const {
    page = 1,
    limit = 20,
    adminId,
    action,
    resourceType,
    startDate,
    endDate,
  } = options || {};

  const offset = (page - 1) * limit;
  const where: any = {};

  if (adminId) {
    where.adminId = adminId;
  }

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resourceType = resourceType;
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

  const { count, rows } = await AdminLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'adminUser',
        attributes: ['name', 'email'],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { logs: rows, total: count };
};

export default {
  getAllUsers,
  updateUserStatus,
  getPendingRestaurants,
  approveOrRejectRestaurant,
  getAllOrders,
  getDashboardAnalytics,
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getRestaurantPerformanceAnalytics,
  getAdminLogs,
};