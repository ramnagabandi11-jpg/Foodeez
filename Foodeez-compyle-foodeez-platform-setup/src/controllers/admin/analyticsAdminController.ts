import { Request, Response, NextFunction } from 'express';
import { Order, Restaurant, Customer, DeliveryPartner, User, Payment } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/analytics/overview - Platform overview dashboard
export const getPlatformOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    // Total counts
    const totalRestaurants = await Restaurant.count();
    const activeRestaurants = await Restaurant.count({ where: { isActive: true } });
    const totalCustomers = await Customer.count();
    const totalDeliveryPartners = await DeliveryPartner.count();
    const activeDeliveryPartners = await DeliveryPartner.count({ where: { isActive: true, isOnline: true } });

    // Order statistics
    const totalOrders = await Order.count({ where: dateFilter });
    const deliveredOrders = await Order.count({ where: { ...dateFilter, status: 'delivered' } });
    const cancelledOrders = await Order.count({
      where: {
        ...dateFilter,
        status: {
          [Op.in]: ['cancelled_by_customer', 'cancelled_by_restaurant', 'cancelled_by_admin'],
        },
      },
    });
    const pendingOrders = await Order.count({
      where: {
        ...dateFilter,
        status: {
          [Op.notIn]: ['delivered', 'cancelled_by_customer', 'cancelled_by_restaurant', 'cancelled_by_admin'],
        },
      },
    });

    // Revenue statistics
    const orders = await Order.findAll({
      where: { ...dateFilter, status: 'delivered' },
      attributes: ['totalAmount', 'platformCommission', 'deliveryFee'],
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount.toString()), 0);
    const totalCommission = orders.reduce((sum, o) => sum + parseFloat(o.platformCommission?.toString() || '0'), 0);
    const totalDeliveryFees = orders.reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);

    // Average order value
    const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

    // Payment statistics
    const successfulPayments = await Payment.count({
      where: { ...dateFilter, status: 'success' },
    });
    const failedPayments = await Payment.count({
      where: { ...dateFilter, status: 'failed' },
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Now',
        },
        users: {
          totalRestaurants,
          activeRestaurants,
          totalCustomers,
          totalDeliveryPartners,
          activeDeliveryPartners,
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          pending: pendingOrders,
          cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
        },
        revenue: {
          totalRevenue,
          totalCommission,
          totalDeliveryFees,
          avgOrderValue,
        },
        payments: {
          successful: successfulPayments,
          failed: failedPayments,
          successRate:
            successfulPayments + failedPayments > 0
              ? (successfulPayments / (successfulPayments + failedPayments)) * 100
              : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/analytics/order-trends - Order trends over time
export const getOrderTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      },
      attributes: ['id', 'status', 'totalAmount', 'createdAt'],
    });

    // Group orders by time period
    const trendsMap: any = {};

    orders.forEach((order) => {
      let key: string;
      const date = new Date(order.createdAt);

      if (groupBy === 'hour') {
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      } else if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!trendsMap[key]) {
        trendsMap[key] = {
          period: key,
          totalOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          revenue: 0,
        };
      }

      trendsMap[key].totalOrders++;
      if (order.status === 'delivered') {
        trendsMap[key].deliveredOrders++;
        trendsMap[key].revenue += parseFloat(order.totalAmount.toString());
      }
      if (['cancelled_by_customer', 'cancelled_by_restaurant', 'cancelled_by_admin'].includes(order.status)) {
        trendsMap[key].cancelledOrders++;
      }
    });

    const trends = Object.values(trendsMap).sort((a: any, b: any) => a.period.localeCompare(b.period));

    res.status(200).json({
      success: true,
      data: {
        period: { startDate: start, endDate: end },
        groupBy,
        trends,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/analytics/restaurant-performance - Restaurant performance metrics
export const getRestaurantPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, sortBy = 'revenue', limit = 20 } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    const restaurants = await Restaurant.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    // Calculate metrics for each restaurant
    const performanceData = await Promise.all(
      restaurants.map(async (restaurant) => {
        const orders = await Order.findAll({
          where: {
            restaurantId: restaurant.id,
            ...dateFilter,
          },
          attributes: ['status', 'totalAmount', 'actualDeliveryTime', 'createdAt'],
        });

        const totalOrders = orders.length;
        const deliveredOrders = orders.filter((o) => o.status === 'delivered');
        const cancelledOrders = orders.filter((o) =>
          ['cancelled_by_customer', 'cancelled_by_restaurant', 'cancelled_by_admin'].includes(o.status)
        );

        const revenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount.toString()), 0);

        const avgDeliveryTime =
          deliveredOrders.length > 0
            ? deliveredOrders.reduce((sum, o) => sum + (o.actualDeliveryTime || 0), 0) / deliveredOrders.length
            : 0;

        return {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          contactEmail: restaurant.get('user')?.email,
          rating: restaurant.rating,
          isActive: restaurant.isActive,
          metrics: {
            totalOrders,
            deliveredOrders: deliveredOrders.length,
            cancelledOrders: cancelledOrders.length,
            cancellationRate: totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0,
            revenue,
            avgOrderValue: deliveredOrders.length > 0 ? revenue / deliveredOrders.length : 0,
            avgDeliveryTime: Math.round(avgDeliveryTime),
          },
        };
      })
    );

    // Sort by selected metric
    performanceData.sort((a, b) => {
      if (sortBy === 'revenue') return b.metrics.revenue - a.metrics.revenue;
      if (sortBy === 'orders') return b.metrics.totalOrders - a.metrics.totalOrders;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'cancellation') return b.metrics.cancellationRate - a.metrics.cancellationRate;
      return 0;
    });

    const topPerformers = performanceData.slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        sortBy,
        restaurants: topPerformers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/analytics/delivery-performance - Delivery partner performance
export const getDeliveryPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, sortBy = 'deliveries', limit = 20 } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    const partners = await DeliveryPartner.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'phone'],
        },
      ],
    });

    // Calculate metrics for each partner
    const performanceData = await Promise.all(
      partners.map(async (partner) => {
        const orders = await Order.findAll({
          where: {
            deliveryPartnerId: partner.id,
            ...dateFilter,
          },
          attributes: ['status', 'deliveryFee', 'actualDeliveryTime'],
        });

        const totalDeliveries = orders.filter((o) => o.status === 'delivered').length;
        const totalEarnings = orders
          .filter((o) => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);

        const avgDeliveryTime =
          totalDeliveries > 0
            ? orders
                .filter((o) => o.status === 'delivered')
                .reduce((sum, o) => sum + (o.actualDeliveryTime || 0), 0) / totalDeliveries
            : 0;

        return {
          partnerId: partner.id,
          partnerName: partner.get('user')?.name,
          phone: partner.get('user')?.phone,
          rating: partner.rating,
          isActive: partner.isActive,
          isOnline: partner.isOnline,
          metrics: {
            totalDeliveries,
            totalEarnings,
            avgDeliveryTime: Math.round(avgDeliveryTime),
            avgEarningsPerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
          },
        };
      })
    );

    // Sort by selected metric
    performanceData.sort((a, b) => {
      if (sortBy === 'deliveries') return b.metrics.totalDeliveries - a.metrics.totalDeliveries;
      if (sortBy === 'earnings') return b.metrics.totalEarnings - a.metrics.totalEarnings;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'speed') return a.metrics.avgDeliveryTime - b.metrics.avgDeliveryTime;
      return 0;
    });

    const topPerformers = performanceData.slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        sortBy,
        deliveryPartners: topPerformers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/analytics/customer-insights - Customer behavior insights
export const getCustomerInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    // Total customers
    const totalCustomers = await Customer.count();
    const newCustomers = await Customer.count({ where: dateFilter });

    // Customer segments by order count
    const customers = await Customer.findAll({
      attributes: ['id', 'totalOrders', 'loyaltyPoints'],
    });

    const segments = {
      new: customers.filter((c) => c.totalOrders === 0).length,
      occasional: customers.filter((c) => c.totalOrders >= 1 && c.totalOrders <= 5).length,
      regular: customers.filter((c) => c.totalOrders >= 6 && c.totalOrders <= 20).length,
      loyal: customers.filter((c) => c.totalOrders > 20).length,
    };

    // Orders in period
    const orders = await Order.findAll({
      where: { ...dateFilter, status: 'delivered' },
      attributes: ['customerId', 'totalAmount'],
    });

    // Calculate customer lifetime value
    const customerOrderCounts: any = {};
    const customerRevenue: any = {};

    orders.forEach((order) => {
      const customerId = order.customerId;
      customerOrderCounts[customerId] = (customerOrderCounts[customerId] || 0) + 1;
      customerRevenue[customerId] =
        (customerRevenue[customerId] || 0) + parseFloat(order.totalAmount.toString());
    });

    const avgOrdersPerCustomer =
      Object.keys(customerOrderCounts).length > 0
        ? Object.values(customerOrderCounts).reduce((sum: any, count: any) => sum + count, 0) /
          Object.keys(customerOrderCounts).length
        : 0;

    const avgRevenuePerCustomer =
      Object.keys(customerRevenue).length > 0
        ? Object.values(customerRevenue).reduce((sum: any, rev: any) => sum + rev, 0) /
          Object.keys(customerRevenue).length
        : 0;

    // Repeat customer rate
    const repeatCustomers = Object.values(customerOrderCounts).filter((count: any) => count > 1).length;
    const repeatRate =
      Object.keys(customerOrderCounts).length > 0
        ? (repeatCustomers / Object.keys(customerOrderCounts).length) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        overview: {
          totalCustomers,
          newCustomers,
          activeCustomers: Object.keys(customerOrderCounts).length,
        },
        segments,
        behavior: {
          avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 10) / 10,
          avgRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100,
          repeatCustomerRate: Math.round(repeatRate * 10) / 10,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/analytics/revenue-breakdown - Revenue breakdown by category
export const getRevenueBreakdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    const orders = await Order.findAll({
      where: { ...dateFilter, status: 'delivered' },
      attributes: ['totalAmount', 'platformCommission', 'deliveryFee', 'discountAmount', 'taxAmount'],
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount.toString()), 0);
    const totalCommission = orders.reduce((sum, o) => sum + parseFloat(o.platformCommission?.toString() || '0'), 0);
    const totalDeliveryFees = orders.reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + parseFloat(o.discountAmount?.toString() || '0'), 0);
    const totalTax = orders.reduce((sum, o) => sum + parseFloat(o.taxAmount?.toString() || '0'), 0);

    // Restaurant earnings (revenue - commission)
    const restaurantEarnings = totalRevenue - totalCommission;

    // Platform earnings (commission + delivery fees)
    const platformEarnings = totalCommission + totalDeliveryFees;

    // Payments
    const payments = await Payment.findAll({
      where: { ...dateFilter, status: 'success' },
      attributes: ['amount', 'paymentMethod'],
    });

    const paymentMethodBreakdown: any = {};
    payments.forEach((payment) => {
      const method = payment.paymentMethod;
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[method].count++;
      paymentMethodBreakdown[method].amount += parseFloat(payment.amount.toString());
    });

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        revenue: {
          total: totalRevenue,
          restaurantEarnings,
          platformEarnings,
          deliveryFees: totalDeliveryFees,
          commission: totalCommission,
          tax: totalTax,
          discounts: totalDiscounts,
        },
        breakdown: {
          platformPercentage: totalRevenue > 0 ? (platformEarnings / totalRevenue) * 100 : 0,
          restaurantPercentage: totalRevenue > 0 ? (restaurantEarnings / totalRevenue) * 100 : 0,
        },
        paymentMethods: paymentMethodBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
