import { Request, Response, NextFunction } from 'express';
import { Customer, User, Order, Wallet, WalletTransaction, LoyaltyTransaction } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/customers - List all customers
export const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, city } = req.query;

    const userWhere: any = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: customers } = await Customer.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'isActive'],
          where: userWhere,
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Get lifetime value for each customer
    const customersWithMetrics = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.findAll({
          where: {
            customerId: customer.id,
            status: 'delivered',
          },
          attributes: ['totalAmount'],
        });

        const lifetimeValue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount.toString()), 0);

        return {
          ...customer.toJSON(),
          metrics: {
            totalOrders: customer.totalOrders,
            lifetimeValue,
            loyaltyPoints: customer.loyaltyPoints,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        customers: customersWithMetrics,
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

// GET /v1/admin/customers/:id - Get customer details
export const getCustomerDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'isActive', 'createdAt'],
        },
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['balance', 'pendingAmount'],
        },
      ],
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get order history
    const orders = await Order.findAll({
      where: { customerId: id },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt'],
    });

    res.status(200).json({
      success: true,
      data: {
        customer,
        recentOrders: orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/customers/:id/status - Block/unblock customer
export const updateCustomerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const customer = await Customer.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const user = customer.get('user') as any;
    if (user) {
      user.isActive = isActive;
      await user.save();
    }

    // TODO: Send notification to customer

    res.status(200).json({
      success: true,
      message: `Customer ${isActive ? 'activated' : 'blocked'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/customers/:id/wallet/adjust - Adjust customer wallet balance
export const adjustWalletBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, transactionType, reason } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { customerId: id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Create wallet transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      amount,
      transactionType,
      description: reason,
      status: 'completed',
    });

    // Update wallet balance
    wallet.balance = parseFloat(wallet.balance.toString()) + parseFloat(amount.toString());
    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Wallet balance adjusted successfully',
      data: {
        newBalance: wallet.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/customers/:id/loyalty/adjust - Adjust loyalty points
export const adjustLoyaltyPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Create loyalty transaction
    await LoyaltyTransaction.create({
      customerId: id,
      points,
      transactionType: points > 0 ? 'earned' : 'redeemed',
      description: reason,
    });

    // Update loyalty points
    customer.loyaltyPoints = customer.loyaltyPoints + points;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Loyalty points adjusted successfully',
      data: {
        newBalance: customer.loyaltyPoints,
      },
    });
  } catch (error) {
    next(error);
  }
};
