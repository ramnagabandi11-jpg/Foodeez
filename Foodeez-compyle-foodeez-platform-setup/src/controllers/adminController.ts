import { Response } from 'express';
import { Op, where, fn, col, literal } from 'sequelize';
import {
  Order,
  Customer,
  Restaurant,
  DeliveryPartner,
  MenuItem,
  Transaction,
  Wallet,
  PromoCode,
  Review,
  Address,
} from '@/models/postgres';
import { OrderAnalytics, RestaurantAnalytics } from '@/models/mongodb';
import { IApiResponse, IAuthPayload } from '@/types';
import { AppError } from '@/utils/errors';
import { emailQueue, analyticsQueue } from '@/config/queue';
import { getSearchAnalytics } from '@/services/searchService';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'admin-controller' },
  transports: [
    new winston.transports.File({ filename: 'admin-error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

/**
 * Get dashboard overview statistics
 */
export const getDashboardOverview = async (req: any, res: Response) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Parallel data fetching
    const [
      totalCustomers,
      totalRestaurants,
      totalDeliveryPartners,
      totalOrders,
      todayOrders,
      yesterdayOrders,
      lastWeekOrders,
      lastMonthOrders,
      totalRevenue,
      todayRevenue,
      lastWeekRevenue,
      lastMonthRevenue,
      activeRestaurants,
      averageOrderValue,
      topCuisines,
    ] = await Promise.all([
      Customer.count({ where: { isActive: true } }),
      Restaurant.count({ where: { isActive: true } }),
      DeliveryPartner.count({ where: { isActive: true } }),
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: today } } }),
      Order.count({ where: { createdAt: { [Op.between]: [yesterday, today] } } }),
      Order.count({ where: { createdAt: { [Op.gte]: lastWeek] } } }),
      Order.count({ where: { createdAt: { [Op.gte]: lastMonth] } } }),
      Order.sum('totalAmount') || 0,
      Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: today } } }) || 0,
      Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: lastWeek] } }) || 0,
      Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: lastMonth] } }) || 0,
      Restaurant.count({ where: { isOpen: true, isActive: true } }),
      Order.avg('totalAmount') || 0,
      OrderAnalytics.aggregate([
        { $unwind: '$cuisineTypes' },
        { $group: { _id: '$cuisineTypes', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Calculate growth percentages
    const orderGrowthYesterday = yesterdayOrders > 0
      ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
      : 0;
    const revenueGrowthYesterday = yesterdayOrders > 0
      ? ((todayRevenue - (await Order.sum('totalAmount', {
          where: { createdAt: { [Op.between]: [yesterday, today] } }
        }) || 0)) / (await Order.sum('totalAmount', {
          where: { createdAt: { [Op.between]: [yesterday, today] } }
        }) || 0)) * 100
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalRestaurants,
          totalDeliveryPartners,
          totalOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          activeRestaurants,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        },
        todayStats: {
          orders: todayOrders,
          revenue: Math.round(todayRevenue * 100) / 100,
          orderGrowth: Math.round(orderGrowthYesterday * 100) / 100,
          revenueGrowth: Math.round(revenueGrowthYesterday * 100) / 100,
        },
        periodStats: {
          lastWeek: {
            orders: lastWeekOrders,
            revenue: Math.round(lastWeekRevenue * 100) / 100,
          },
          lastMonth: {
            orders: lastMonthOrders,
            revenue: Math.round(lastMonthRevenue * 100) / 100,
          },
        },
        topCuisines: topCuisines.map((cuisine: any) => ({
          name: cuisine._id,
          count: cuisine.count,
        })),
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard overview',
      },
    } as IApiResponse);
  }
};

/**
 * Get orders with filters and pagination
 */
export const getOrders = async (req: any, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      restaurantId,
      customerId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};
    const orderWhere: any = {};

    // Build filters
    if (status) where.status = status;
    if (restaurantId) where.restaurantId = restaurantId;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Search by order number or customer name
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${search}%` } },
        { '$customer.name$': { [Op.iLike]: `%${search}%` } },
        { '$customer.email$': { [Op.iLike]: `%${search}%` } },
        { '$restaurant.name$': { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'menuItemId', 'menuItemName', 'quantity', 'subtotal'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number(limit),
        },
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get orders',
      },
    } as IApiResponse);
  }
};

/**
 * Get order details with full information
 */
export const getOrderDetails = async (req: any, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [
            {
              model: Address,
              as: 'addresses',
              where: { id: literal(`"deliveryAddressId"`) },
              required: false,
            },
          ],
        },
        {
          model: Restaurant,
          as: 'restaurant',
        },
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Transaction,
          as: 'transactions',
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      } as IApiResponse);
    }

    res.json({
      success: true,
      data: { order },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get order details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get order details',
      },
    } as IApiResponse);
  }
};

/**
 * Get restaurants management data
 */
export const getRestaurants = async (req: any, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      isOpen,
      city,
      cuisine,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isOpen !== undefined) where.isOpen = isOpen === 'true';
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (cuisine) where.cuisineTypes = { [Op.contains]: [cuisine] };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Restaurant.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id'],
          required: false,
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        include: [
          [
            fn('COUNT', col('orders.id')),
            'totalOrders'
          ]
        ]
      },
      group: ['Restaurant.id'],
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      success: true,
      data: {
        restaurants: rows.map(restaurant => ({
          ...restaurant.toJSON(),
          totalOrders: parseInt(restaurant.getDataValue('totalOrders') || '0'),
        })),
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number(limit),
        },
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get restaurants:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get restaurants',
      },
    } as IApiResponse);
  }
};

/**
 * Get customers management data
 */
export const getCustomers = async (req: any, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      city,
      registeredFrom,
      registeredTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (registeredFrom || registeredTo) {
      where.createdAt = {};
      if (registeredFrom) where.createdAt[Op.gte] = new Date(registeredFrom);
      if (registeredTo) where.createdAt[Op.lte] = new Date(registeredTo);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'totalAmount'],
          required: false,
        },
        {
          model: Address,
          as: 'addresses',
          where: city ? { city: { [Op.iLike]: `%${city}%` } } : undefined,
          required: false,
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        include: [
          [
            fn('COUNT', col('orders.id')),
            'totalOrders'
          ],
          [
            fn('SUM', col('orders.totalAmount')),
            'totalSpent'
          ]
        ]
      },
      group: ['Customer.id'],
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      success: true,
      data: {
        customers: rows.map(customer => ({
          ...customer.toJSON(),
          totalOrders: parseInt(customer.getDataValue('totalOrders') || '0'),
          totalSpent: parseFloat(customer.getDataValue('totalSpent') || '0'),
        })),
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number(limit),
        },
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get customers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get customers',
      },
    } as IApiResponse);
  }
};

/**
 * Get delivery partners management data
 */
export const getDeliveryPartners = async (req: any, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      isAvailable,
      city,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (city) where.city = { [Op.iLike]: `%${city}%` };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await DeliveryPartner.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'deliveries',
          attributes: ['id', 'status'],
          required: false,
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: {
        include: [
          [
            fn('COUNT', col('deliveries.id')),
            'totalDeliveries'
          ]
        ]
      },
      group: ['DeliveryPartner.id'],
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      success: true,
      data: {
        deliveryPartners: rows.map(partner => ({
          ...partner.toJSON(),
          totalDeliveries: parseInt(partner.getDataValue('totalDeliveries') || '0'),
        })),
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: count,
          itemsPerPage: Number(limit),
        },
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get delivery partners:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get delivery partners',
      },
    } as IApiResponse);
  }
};

/**
 * Get analytics data
 */
export const getAnalytics = async (req: any, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      type = 'revenue',
      groupBy = 'day'
    } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let analyticsData: any = {};

    switch (type) {
      case 'revenue':
        analyticsData = await getRevenueAnalytics(start, end, groupBy);
        break;
      case 'orders':
        analyticsData = await getOrderAnalytics(start, end, groupBy);
        break;
      case 'customers':
        analyticsData = await getCustomerAnalytics(start, end, groupBy);
        break;
      case 'restaurants':
        analyticsData = await getRestaurantAnalytics(start, end, groupBy);
        break;
      default:
        analyticsData = await getRevenueAnalytics(start, end, groupBy);
    }

    res.json({
      success: true,
      data: analyticsData,
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get analytics',
      },
    } as IApiResponse);
  }
};

/**
 * Send promotional email to customers
 */
export const sendPromotionalEmail = async (req: any, res: Response) => {
  try {
    const {
      subject,
      title,
      description,
      discountCode,
      validUntil,
      termsAndConditions,
      customerFilter = {},
    } = req.body;

    // Get customers based on filter
    const customers = await Customer.findAll({
      where: customerFilter,
      attributes: ['id', 'name', 'email'],
    });

    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_CUSTOMERS',
          message: 'No customers found matching the criteria',
        },
      } as IApiResponse);
    }

    // Queue promotional emails
    const promotion = {
      subject,
      title,
      description,
      discountCode,
      validUntil,
      termsAndConditions,
    };

    // Split customers into batches to avoid overwhelming the email service
    const batchSize = 100;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);

      emailQueue.add('promotional-email', {
        customers: batch,
        promotion,
      }, {
        delay: i * 1000, // Stagger batch processing
        removeOnComplete: true,
      });
    }

    res.json({
      success: true,
      data: {
        message: `Promotional email queued for ${customers.length} customers`,
        totalCustomers: customers.length,
        batchesSent: Math.ceil(customers.length / batchSize),
      },
    } as IApiResponse);
  } catch (error) {
    logger.error('Failed to send promotional email:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send promotional email',
      },
    } as IApiResponse);
  }
};

// Analytics helper functions
async function getRevenueAnalytics(startDate: Date, endDate: Date, groupBy: string) {
  const dateFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-%u' : '%Y-%m-%d';

  const revenueData = await Order.findAll({
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: [
      [fn('DATE_TRUNC', groupBy, col('createdAt')), 'period'],
      [fn('SUM', col('totalAmount')), 'revenue'],
      [fn('COUNT', col('id')), 'orders'],
    ],
    group: [fn('DATE_TRUNC', groupBy, col('createdAt'))],
    order: [[fn('DATE_TRUNC', groupBy, col('createdAt')), 'ASC']],
  });

  return {
    type: 'revenue',
    data: revenueData.map(item => ({
      period: item.getDataValue('period'),
      revenue: parseFloat(item.getDataValue('revenue') || '0'),
      orders: parseInt(item.getDataValue('orders') || '0'),
    })),
    totalRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.getDataValue('revenue') || '0'), 0),
    totalOrders: revenueData.reduce((sum, item) => sum + parseInt(item.getDataValue('orders') || '0'), 0),
  };
}

async function getOrderAnalytics(startDate: Date, endDate: Date, groupBy: string) {
  const orderStats = await Order.findAll({
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['status'],
  });

  const averageOrderValue = await Order.findOne({
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: [[fn('AVG', col('totalAmount')), 'avgValue']],
  });

  return {
    type: 'orders',
    statusBreakdown: orderStats.map(item => ({
      status: item.status,
      count: parseInt(item.getDataValue('count') || '0'),
    })),
    averageOrderValue: parseFloat(averageOrderValue?.getDataValue('avgValue') || '0'),
    totalOrders: orderStats.reduce((sum, item) => sum + parseInt(item.getDataValue('count') || '0'), 0),
  };
}

async function getCustomerAnalytics(startDate: Date, endDate: Date, groupBy: string) {
  const newCustomers = await Customer.findAll({
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      [fn('DATE_TRUNC', groupBy, col('createdAt')), 'period'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE_TRUNC', groupBy, col('createdAt'))],
    order: [[fn('DATE_TRUNC', groupBy, col('createdAt')), 'ASC']],
  });

  const totalCustomers = await Customer.count();
  const activeCustomers = await Customer.count({
    include: [{
      model: Order,
      as: 'orders',
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      required: true,
    }],
  });

  return {
    type: 'customers',
    newCustomersData: newCustomers.map(item => ({
      period: item.getDataValue('period'),
      count: parseInt(item.getDataValue('count') || '0'),
    })),
    totalCustomers,
    activeCustomers,
    newCustomersCount: newCustomers.reduce((sum, item) => sum + parseInt(item.getDataValue('count') || '0'), 0),
  };
}

async function getRestaurantAnalytics(startDate: Date, endDate: Date, groupBy: string) {
  const restaurantStats = await Restaurant.findAll({
    attributes: [
      'isActive',
      'isOpen',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['isActive', 'isOpen'],
  });

  const topRestaurants = await Order.findAll({
    where: {
      createdAt: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      'restaurantId',
      [fn('COUNT', col('id')), 'orderCount'],
      [fn('SUM', col('totalAmount')), 'revenue'],
    ],
    group: ['restaurantId'],
    order: [[fn('SUM', col('totalAmount')), 'DESC']],
    limit: 10,
    include: [{
      model: Restaurant,
      as: 'restaurant',
      attributes: ['name'],
    }],
  });

  return {
    type: 'restaurants',
    statusBreakdown: restaurantStats.map(item => ({
      isActive: item.isActive,
      isOpen: item.isOpen,
      count: parseInt(item.getDataValue('count') || '0'),
    })),
    topRestaurants: topRestaurants.map(item => ({
      restaurantId: item.restaurantId,
      restaurantName: item.restaurant?.name,
      orderCount: parseInt(item.getDataValue('orderCount') || '0'),
      revenue: parseFloat(item.getDataValue('revenue') || '0'),
    })),
  };
}

export default {
  getDashboardOverview,
  getOrders,
  getOrderDetails,
  getRestaurants,
  getCustomers,
  getDeliveryPartners,
  getAnalytics,
  sendPromotionalEmail,
};