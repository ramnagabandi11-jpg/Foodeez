import { Request, Response, NextFunction } from 'express';
import { Restaurant, Order, RestaurantSubscription, Wallet, WalletTransaction, User } from '@/models/postgres';
import MenuItem from '@/models/mongodb/MenuItem';
import RestaurantAnalytics from '@/models/mongodb/RestaurantAnalytics';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';
import { getIO } from '@/sockets';

// GET /v1/restaurant/profile - Get restaurant profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const restaurant = await Restaurant.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Get today's delivery count for subscription tier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveryCount = await Order.count({
      where: {
        restaurantId: restaurant.id,
        status: 'delivered',
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...restaurant.toJSON(),
        todayDeliveryCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/restaurant/profile - Update restaurant profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, description, address, phone, openingTime, closingTime, cuisineTypes, logo } = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate opening < closing time
    if (openingTime && closingTime) {
      const opening = new Date(`2000-01-01T${openingTime}`);
      const closing = new Date(`2000-01-01T${closingTime}`);
      if (opening >= closing) {
        throw new AppError('Opening time must be before closing time', 400);
      }
    }

    // Update fields
    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (address) restaurant.address = address;
    if (phone) restaurant.phone = phone;
    if (openingTime) restaurant.openingTime = openingTime;
    if (closingTime) restaurant.closingTime = closingTime;
    if (cuisineTypes) restaurant.cuisineTypes = cuisineTypes;
    if (logo) restaurant.logo = logo;

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/menu - Get all menu items
export const getMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { category, isAvailable } = req.query;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const filter: any = { restaurantId: restaurant.id };
    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/restaurant/menu - Add new menu item
export const addMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, description, price, category, isVegetarian, isVegan, isGlutenFree, spiceLevel, preparationTime, isAvailable, image, images, customizations, nutrition, allergens, tags } = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const menuItem = await MenuItem.create({
      restaurantId: restaurant.id,
      name,
      description,
      price,
      category,
      isVegetarian: isVegetarian || false,
      isVegan: isVegan || false,
      isGlutenFree: isGlutenFree || false,
      spiceLevel: spiceLevel || 'none',
      preparationTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      images: images || (image ? [image] : []),
      customizations: customizations || [],
      nutrition: nutrition || null,
      allergens: allergens || [],
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/restaurant/menu/:menuItemId - Update menu item
export const updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { menuItemId } = req.params;
    const updateData = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurantId: restaurant.id,
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Update only provided fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        (menuItem as any)[key] = updateData[key];
      }
    });

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/restaurant/menu/:menuItemId - Delete menu item (soft delete)
export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { menuItemId } = req.params;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurantId: restaurant.id,
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Soft delete by setting isAvailable to false
    menuItem.isAvailable = false;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/restaurant/menu/:menuItemId/availability - Toggle item availability
export const toggleAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { menuItemId } = req.params;
    const { isAvailable } = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurantId: restaurant.id,
    });

    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item availability updated',
      data: { isAvailable: menuItem.isAvailable },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/orders - Get restaurant orders
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20, date } = req.query;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const where: any = { restaurantId: restaurant.id };
    if (status) where.status = status;

    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.createdAt = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDate,
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
          through: { attributes: [] },
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        orders,
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

// POST /v1/restaurant/orders/:orderId/accept - Accept incoming order
export const acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { estimatedPreparationTime } = req.body;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'pending') {
      throw new AppError('Order cannot be accepted in current status', 400);
    }

    order.status = 'restaurant_accepted';
    order.restaurantAcceptedAt = new Date();
    order.estimatedDeliveryTime = new Date(Date.now() + estimatedPreparationTime * 60000);
    await order.save();

    // Emit Socket.io event to customer
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'restaurant_accepted',
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      message: 'Restaurant accepted your order',
    });

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/restaurant/orders/:orderId/reject - Reject order
export const rejectOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'pending' && order.status !== 'restaurant_accepted') {
      throw new AppError('Order cannot be rejected in current status', 400);
    }

    order.status = 'cancelled_by_restaurant';
    order.cancellationReason = rejectionReason;
    order.cancelledAt = new Date();
    await order.save();

    // TODO: Trigger refund process (should be handled by payment service)

    // Emit Socket.io event to customer
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'cancelled_by_restaurant',
      reason: rejectionReason,
      message: 'Restaurant rejected your order. Refund will be processed',
    });

    res.status(200).json({
      success: true,
      message: 'Order rejected successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/restaurant/orders/:orderId/ready - Mark order ready for pickup
export const markOrderReady = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'restaurant_accepted' && order.status !== 'preparing') {
      throw new AppError('Order cannot be marked ready in current status', 400);
    }

    order.status = 'ready_for_pickup';
    order.readyForPickupAt = new Date();
    await order.save();

    // Emit Socket.io event to assigned delivery partner
    const io = getIO();
    if (order.deliveryPartnerId) {
      io.to(`delivery:${order.deliveryPartnerId}`).emit('order:ready', {
        orderId: order.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        message: 'Order is ready for pickup',
      });
    }

    // Also notify customer
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'ready_for_pickup',
      message: 'Your order is ready for pickup',
    });

    res.status(200).json({
      success: true,
      message: 'Order marked as ready for pickup',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/analytics - Get restaurant analytics dashboard
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    let { startDate, endDate } = req.query;

    const restaurant = await Restaurant.findOne({ where: { userId } });
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

    // Get analytics from MongoDB
    const analytics = await RestaurantAnalytics.find({
      restaurantId: restaurant.id,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    }).sort({ date: 1 });

    // Aggregate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        totalOrders: acc.totalOrders + (day.totalOrders || 0),
        totalRevenue: acc.totalRevenue + (day.totalRevenue || 0),
      }),
      { totalOrders: 0, totalRevenue: 0 }
    );

    const avgOrderValue = totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;

    // Get top menu items (aggregate from all days)
    const topItems: any = {};
    analytics.forEach(day => {
      day.topMenuItems?.forEach((item: any) => {
        if (!topItems[item.menuItemId]) {
          topItems[item.menuItemId] = {
            ...item,
            orderCount: 0,
          };
        }
        topItems[item.menuItemId].orderCount += item.orderCount;
      });
    });

    const topMenuItems = Object.values(topItems)
      .sort((a: any, b: any) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Peak hours analysis (aggregate)
    const peakHours: any = {};
    analytics.forEach(day => {
      if (day.peakHour !== undefined) {
        peakHours[day.peakHour] = (peakHours[day.peakHour] || 0) + 1;
      }
    });

    const mostCommonPeakHour = Object.entries(peakHours).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];

    res.status(200).json({
      success: true,
      data: {
        totalOrders: totals.totalOrders,
        totalRevenue: totals.totalRevenue,
        avgOrderValue,
        topMenuItems,
        peakHour: mostCommonPeakHour ? parseInt(mostCommonPeakHour) : null,
        dailyData: analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/analytics/revenue - Revenue breakdown
export const getRevenueBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const analytics = await RestaurantAnalytics.find({
      restaurantId: restaurant.id,
      date: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    }).sort({ date: 1 });

    // Group by day, week, or month
    let groupedData: any[] = [];
    if (groupBy === 'day') {
      groupedData = analytics.map(day => ({
        date: day.date,
        revenue: day.totalRevenue,
        orders: day.totalOrders,
      }));
    } else if (groupBy === 'week') {
      // Group by week
      const weeks: any = {};
      analytics.forEach(day => {
        const week = getWeekNumber(new Date(day.date));
        if (!weeks[week]) {
          weeks[week] = { revenue: 0, orders: 0, week };
        }
        weeks[week].revenue += day.totalRevenue || 0;
        weeks[week].orders += day.totalOrders || 0;
      });
      groupedData = Object.values(weeks);
    } else if (groupBy === 'month') {
      // Group by month
      const months: any = {};
      analytics.forEach(day => {
        const month = new Date(day.date).toISOString().slice(0, 7); // YYYY-MM
        if (!months[month]) {
          months[month] = { revenue: 0, orders: 0, month };
        }
        months[month].revenue += day.totalRevenue || 0;
        months[month].orders += day.totalOrders || 0;
      });
      groupedData = Object.values(months);
    }

    res.status(200).json({
      success: true,
      data: groupedData,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get week number
function getWeekNumber(date: Date): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber}`;
}

// GET /v1/restaurant/subscription - Get subscription details
export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Get today's delivery count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveryCount = await Order.count({
      where: {
        restaurantId: restaurant.id,
        status: 'delivered',
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // Calculate current tier and amount
    const { tier, amount, nextTierThreshold } = calculateSubscriptionTier(todayDeliveryCount);

    // Get latest subscription record
    const latestSubscription = await RestaurantSubscription.findOne({
      where: { restaurantId: restaurant.id },
      order: [['billingDate', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        currentTier: tier,
        amount,
        todayDeliveryCount,
        nextTierThreshold,
        status: latestSubscription?.status || 'active',
        billingDate: latestSubscription?.billingDate || today,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate subscription tier
function calculateSubscriptionTier(deliveryCount: number): { tier: string; amount: number; nextTierThreshold: number } {
  if (deliveryCount >= 1 && deliveryCount <= 9) {
    return { tier: '1-9 deliveries', amount: 99, nextTierThreshold: 10 };
  } else if (deliveryCount >= 10 && deliveryCount <= 19) {
    return { tier: '10-19 deliveries', amount: 199, nextTierThreshold: 20 };
  } else if (deliveryCount >= 20 && deliveryCount <= 29) {
    return { tier: '20-29 deliveries', amount: 299, nextTierThreshold: 30 };
  } else if (deliveryCount >= 30 && deliveryCount <= 39) {
    return { tier: '30-39 deliveries', amount: 399, nextTierThreshold: 40 };
  } else if (deliveryCount >= 40 && deliveryCount <= 49) {
    return { tier: '40-49 deliveries', amount: 499, nextTierThreshold: 50 };
  } else if (deliveryCount >= 50 && deliveryCount <= 59) {
    return { tier: '50-59 deliveries', amount: 599, nextTierThreshold: 60 };
  } else if (deliveryCount >= 60) {
    // Continue pattern: +Rs. 100 per 10 deliveries
    const tier = Math.floor(deliveryCount / 10);
    const amount = 99 + (tier - 1) * 100;
    const nextThreshold = (tier + 1) * 10;
    return { tier: `${tier * 10}+ deliveries`, amount, nextTierThreshold: nextThreshold };
  } else {
    return { tier: '0 deliveries', amount: 99, nextTierThreshold: 1 };
  }
}

// GET /v1/restaurant/subscription/history - Get billing history
export const getSubscriptionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const { count, rows: subscriptions } = await RestaurantSubscription.findAndCountAll({
      where: { restaurantId: restaurant.id },
      order: [['billingDate', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/wallet - Get restaurant wallet/earnings
export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { restaurantId: restaurant.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Get last settlement date
    const lastSettlement = await WalletTransaction.findOne({
      where: {
        walletId: wallet.id,
        transactionType: 'settlement',
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        totalEarnings: wallet.balance,
        pendingSettlements: wallet.pendingAmount,
        availableBalance: wallet.balance - wallet.pendingAmount,
        lastSettlementDate: lastSettlement?.createdAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/restaurant/wallet/transactions - Get transaction history
export const getWalletTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, type } = req.query;

    const restaurant = await Restaurant.findOne({ where: { userId } });
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { restaurantId: restaurant.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const where: any = { walletId: wallet.id };
    if (type) {
      where.transactionType = type;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: transactions } = await WalletTransaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
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
