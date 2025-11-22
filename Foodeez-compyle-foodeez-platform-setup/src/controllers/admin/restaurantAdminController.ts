import { Request, Response, NextFunction } from 'express';
import { Restaurant, User, RestaurantSubscription, Order, Wallet, WalletTransaction } from '@/models/postgres';
import RestaurantAnalytics from '@/models/mongodb/RestaurantAnalytics';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/restaurants - List all restaurants
export const listRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, city, page = 1, limit = 20, search } = req.query;

    const where: any = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (city) where.city = city;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Get key metrics for each restaurant
    const restaurantsWithMetrics = await Promise.all(
      restaurants.map(async (restaurant) => {
        const totalOrders = await Order.count({
          where: { restaurantId: restaurant.id },
        });

        const revenue = await Order.sum('itemTotal', {
          where: {
            restaurantId: restaurant.id,
            status: 'delivered',
          },
        });

        return {
          ...restaurant.toJSON(),
          metrics: {
            totalOrders,
            revenue: revenue || 0,
            rating: restaurant.rating,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        restaurants: restaurantsWithMetrics,
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

// GET /v1/admin/restaurants/:id - Get restaurant details
export const getRestaurantDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
        },
      ],
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Get subscription history
    const subscriptions = await RestaurantSubscription.findAll({
      where: { restaurantId: id },
      order: [['billingDate', 'DESC']],
      limit: 10,
    });

    // Get performance metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.findAll({
      where: {
        restaurantId: id,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: ['status', 'itemTotal'],
    });

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + parseFloat(o.itemTotal.toString()), 0);

    res.status(200).json({
      success: true,
      data: {
        restaurant,
        subscriptions,
        performanceMetrics: {
          last30Days: {
            totalOrders,
            deliveredOrders,
            totalRevenue,
            completionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/restaurants - Register restaurant (onboarding)
export const registerRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      restaurantName,
      description,
      address,
      city,
      state,
      latitude,
      longitude,
      cuisineTypes,
      openingTime,
      closingTime,
      logo,
    } = req.body;

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new AppError('Email or phone already registered', 400);
    }

    // Create user account
    const user = await User.create({
      name,
      email,
      phone,
      password, // Should be hashed in User model beforeCreate hook
      role: 'restaurant',
      isActive: true,
    });

    // Create restaurant
    const restaurant = await Restaurant.create({
      userId: user.id,
      name: restaurantName,
      description,
      address,
      city,
      state,
      latitude,
      longitude,
      cuisineTypes: cuisineTypes || [],
      openingTime,
      closingTime,
      logo: logo || null,
      isActive: false, // Pending verification
      rating: 0,
      totalRatings: 0,
    });

    // Create wallet for restaurant
    await Wallet.create({
      userId: user.id,
      restaurantId: restaurant.id,
      balance: 0,
      pendingAmount: 0,
    });

    // TODO: Send credentials via email

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        restaurant,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/restaurants/:id - Update restaurant
export const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        (restaurant as any)[key] = updateData[key];
      }
    });

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/restaurants/:id/status - Approve/suspend restaurant
export const updateRestaurantStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (status === 'active') {
      restaurant.isActive = true;
    } else if (status === 'suspended' || status === 'closed') {
      restaurant.isActive = false;
    }

    await restaurant.save();

    // TODO: Send notification to restaurant

    res.status(200).json({
      success: true,
      message: `Restaurant ${status === 'active' ? 'activated' : 'suspended'} successfully`,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/restaurants/:id/subscription/waive - Waive subscription fee for a day
export const waiveSubscriptionFee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, reason } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Create waived subscription record
    await RestaurantSubscription.create({
      restaurantId: id,
      billingDate: date,
      amount: 0,
      status: 'waived',
      metadata: { reason },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription fee waived successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/restaurants/:id/analytics - View restaurant analytics
export const getRestaurantAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let { startDate, endDate } = req.query;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Default to last 30 days
    if (!startDate || !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0] as string;
      endDate = end.toISOString().split('T')[0] as string;
    }

    const analytics = await RestaurantAnalytics.find({
      restaurantId: id,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    }).sort({ date: 1 });

    const totals = analytics.reduce(
      (acc, day) => ({
        totalOrders: acc.totalOrders + (day.totalOrders || 0),
        totalRevenue: acc.totalRevenue + (day.totalRevenue || 0),
      }),
      { totalOrders: 0, totalRevenue: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
        },
        analytics,
        summary: {
          totalOrders: totals.totalOrders,
          totalRevenue: totals.totalRevenue,
          avgOrderValue: totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
