import { Request, Response, NextFunction } from 'express';
import { Restaurant, DeliveryPartner, Order, Wallet, WalletTransaction, User, Payment } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/finance/subscriptions - View tiered subscription billing
export const getSubscriptionBilling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, restaurantId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (restaurantId) where.id = restaurantId;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: restaurants } = await Restaurant.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone'],
        },
      ],
      limit: Number(limit),
      offset,
    });

    // Calculate subscription billing for each restaurant
    const billingData = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Get order count for date range
        const orderWhere: any = {
          restaurantId: restaurant.id,
          status: 'delivered',
        };

        if (startDate && endDate) {
          orderWhere.createdAt = dateFilter.createdAt;
        }

        const deliveredOrders = await Order.count({ where: orderWhere });

        // Calculate tier
        let tier: string;
        let dailyRate: number;
        let billingDays = 30; // Default

        if (startDate && endDate) {
          const start = new Date(startDate as string);
          const end = new Date(endDate as string);
          billingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        const dailyDeliveryAvg = deliveredOrders / billingDays;

        if (dailyDeliveryAvg >= 1 && dailyDeliveryAvg <= 9) {
          tier = '1-9 deliveries/day';
          dailyRate = 99;
        } else if (dailyDeliveryAvg >= 10 && dailyDeliveryAvg <= 19) {
          tier = '10-19 deliveries/day';
          dailyRate = 199;
        } else if (dailyDeliveryAvg >= 20 && dailyDeliveryAvg <= 29) {
          tier = '20-29 deliveries/day';
          dailyRate = 299;
        } else if (dailyDeliveryAvg >= 30 && dailyDeliveryAvg <= 39) {
          tier = '30-39 deliveries/day';
          dailyRate = 399;
        } else if (dailyDeliveryAvg >= 40 && dailyDeliveryAvg <= 49) {
          tier = '40-49 deliveries/day';
          dailyRate = 499;
        } else if (dailyDeliveryAvg >= 50) {
          tier = '50+ deliveries/day';
          dailyRate = 599;
        } else {
          tier = 'No deliveries';
          dailyRate = 0;
        }

        const totalAmount = dailyRate * billingDays;
        const waived = restaurant.subscriptionFeeWaived || false;
        const amountDue = waived ? 0 : totalAmount;

        return {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          contactEmail: restaurant.get('user')?.email,
          billingPeriod: { startDate, endDate },
          tier,
          dailyRate,
          billingDays,
          totalDeliveries: deliveredOrders,
          avgDailyDeliveries: Math.round(dailyDeliveryAvg * 10) / 10,
          totalAmount,
          subscriptionFeeWaived: waived,
          amountDue,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        billingRecords: billingData,
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

// GET /v1/admin/finance/settlements - Daily settlements for restaurants
export const getDailySettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, restaurantId, status, page = 1, limit = 20 } = req.query;

    let targetDate: Date;
    if (date) {
      targetDate = new Date(date as string);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const orderWhere: any = {
      status: 'delivered',
      createdAt: {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay,
      },
    };

    if (restaurantId) {
      orderWhere.restaurantId = restaurantId;
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
    });

    // Group by restaurant
    const settlementsByRestaurant: any = {};

    orders.forEach((order) => {
      const restId = order.restaurantId;
      if (!settlementsByRestaurant[restId]) {
        settlementsByRestaurant[restId] = {
          restaurantId: restId,
          restaurantName: order.get('restaurant')?.name,
          contactEmail: order.get('restaurant')?.user?.email,
          orders: [],
          totalOrders: 0,
          totalRevenue: 0,
          platformCommission: 0,
          netSettlement: 0,
        };
      }

      const orderAmount = parseFloat(order.totalAmount.toString());
      const commission = parseFloat(order.platformCommission?.toString() || '0');

      settlementsByRestaurant[restId].orders.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: orderAmount,
        commission,
      });
      settlementsByRestaurant[restId].totalOrders++;
      settlementsByRestaurant[restId].totalRevenue += orderAmount;
      settlementsByRestaurant[restId].platformCommission += commission;
      settlementsByRestaurant[restId].netSettlement += (orderAmount - commission);
    });

    const settlements = Object.values(settlementsByRestaurant);

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedSettlements = settlements.slice(offset, offset + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        settlements: paginatedSettlements,
        summary: {
          totalRestaurants: settlements.length,
          totalOrders: settlements.reduce((sum: number, s: any) => sum + s.totalOrders, 0),
          totalRevenue: settlements.reduce((sum: number, s: any) => sum + s.totalRevenue, 0),
          totalCommission: settlements.reduce((sum: number, s: any) => sum + s.platformCommission, 0),
          totalNetSettlement: settlements.reduce((sum: number, s: any) => sum + s.netSettlement, 0),
        },
        pagination: {
          total: settlements.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(settlements.length / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/finance/delivery-earnings - Delivery partner earnings
export const getDeliveryEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, deliveryPartnerId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (deliveryPartnerId) where.id = deliveryPartnerId;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: partners } = await DeliveryPartner.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email', 'phone'],
        },
      ],
      limit: Number(limit),
      offset,
    });

    // Calculate earnings for each partner
    const earningsData = await Promise.all(
      partners.map(async (partner) => {
        const orderWhere: any = {
          deliveryPartnerId: partner.id,
          status: 'delivered',
        };

        if (startDate && endDate) {
          orderWhere.createdAt = {
            [Op.gte]: new Date(startDate as string),
            [Op.lte]: new Date(endDate as string),
          };
        }

        const orders = await Order.findAll({
          where: orderWhere,
          attributes: ['id', 'orderNumber', 'deliveryFee', 'createdAt'],
        });

        const totalDeliveries = orders.length;
        const totalEarnings = orders.reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);

        // Get wallet balance
        const wallet = await Wallet.findOne({
          where: { deliveryPartnerId: partner.id },
        });

        return {
          deliveryPartnerId: partner.id,
          partnerName: partner.get('user')?.name,
          phone: partner.get('user')?.phone,
          totalDeliveries,
          totalEarnings,
          walletBalance: wallet ? parseFloat(wallet.balance.toString()) : 0,
          pendingAmount: wallet ? parseFloat(wallet.pendingAmount?.toString() || '0') : 0,
          orders: orders.map(o => ({
            orderId: o.id,
            orderNumber: o.orderNumber,
            deliveryFee: o.deliveryFee,
            date: o.createdAt,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        earnings: earningsData,
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

// GET /v1/admin/finance/transactions - Transaction history
export const getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, transactionType, userId, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (transactionType) where.transactionType = transactionType;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Get wallet transactions
    const { count, rows: transactions } = await WalletTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Wallet,
          as: 'wallet',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'role'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const transactionsData = transactions.map((txn) => ({
      id: txn.id,
      amount: txn.amount,
      transactionType: txn.transactionType,
      description: txn.description,
      status: txn.status,
      user: {
        id: txn.get('wallet')?.get('user')?.id,
        name: txn.get('wallet')?.get('user')?.name,
        email: txn.get('wallet')?.get('user')?.email,
        role: txn.get('wallet')?.get('user')?.role,
      },
      createdAt: txn.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: transactionsData,
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

// POST /v1/admin/finance/manual-payout - Process manual payout
export const processManualPayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, amount, payoutMethod, upiId, bankAccount, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < amount) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    // Create debit transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      amount: -amount,
      transactionType: 'payout',
      description: `Manual payout: ${reason}. Method: ${payoutMethod}`,
      status: 'completed',
      metadata: {
        payoutMethod,
        upiId: upiId || null,
        bankAccount: bankAccount || null,
        processedBy: req.user?.id,
      },
    });

    // Update wallet balance
    wallet.balance = currentBalance - amount;
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Manual payout processed successfully',
      data: {
        userId,
        userName: user.name,
        amount,
        payoutMethod,
        newBalance: wallet.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/finance/reconcile-wallet - Reconcile wallet balance
export const reconcileWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, expectedBalance, actualBalance, adjustmentReason } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    const difference = actualBalance - currentBalance;

    if (difference === 0) {
      return res.status(200).json({
        success: true,
        message: 'Wallet is already balanced',
        data: {
          currentBalance,
          difference: 0,
        },
      });
    }

    // Create adjustment transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      amount: difference,
      transactionType: 'adjustment',
      description: `Wallet reconciliation: ${adjustmentReason}. Expected: ${expectedBalance}, Actual: ${actualBalance}`,
      status: 'completed',
      metadata: {
        expectedBalance,
        actualBalance,
        previousBalance: currentBalance,
        reconciledBy: req.user?.id,
      },
    });

    // Update wallet balance
    wallet.balance = actualBalance;
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Wallet reconciled successfully',
      data: {
        userId,
        previousBalance: currentBalance,
        newBalance: wallet.balance,
        adjustment: difference,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/finance/refunds - Refund history
export const getRefundHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, customerId, page = 1, limit = 20 } = req.query;

    const where: any = {
      transactionType: 'refund',
    };

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: refunds } = await WalletTransaction.findAndCountAll({
      where,
      include: [
        {
          model: Wallet,
          as: 'wallet',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const refundData = refunds.map((refund) => ({
      id: refund.id,
      amount: refund.amount,
      description: refund.description,
      status: refund.status,
      customer: {
        id: refund.get('wallet')?.get('user')?.id,
        name: refund.get('wallet')?.get('user')?.name,
        email: refund.get('wallet')?.get('user')?.email,
      },
      processedAt: refund.createdAt,
    }));

    const totalRefundAmount = refunds.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

    res.status(200).json({
      success: true,
      data: {
        refunds: refundData,
        summary: {
          totalRefunds: count,
          totalAmount: totalRefundAmount,
        },
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

// GET /v1/admin/finance/payment-gateway - Payment gateway reports
export const getPaymentGatewayReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (status) where.status = status;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber'],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const paymentData = payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.get('order')?.orderNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId,
      customer: {
        name: payment.get('order')?.get('customer')?.name,
        email: payment.get('order')?.get('customer')?.email,
      },
      createdAt: payment.createdAt,
    }));

    // Calculate statistics
    const successfulPayments = payments.filter((p) => p.status === 'success');
    const totalSuccessAmount = successfulPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const failedPayments = payments.filter((p) => p.status === 'failed');
    const pendingPayments = payments.filter((p) => p.status === 'pending');

    res.status(200).json({
      success: true,
      data: {
        payments: paymentData,
        statistics: {
          total: count,
          successful: successfulPayments.length,
          failed: failedPayments.length,
          pending: pendingPayments.length,
          totalSuccessAmount,
          successRate: count > 0 ? (successfulPayments.length / count) * 100 : 0,
        },
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
