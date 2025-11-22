import { Request, Response, NextFunction } from 'express';
import { Customer, Address, Wallet, WalletTransaction, LoyaltyTransaction, User } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/customer/profile - Get customer profile details
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Wallet,
          as: 'wallet',
          attributes: ['id', 'balance', 'pendingAmount'],
        },
      ],
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/customer/profile - Update customer profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, email, phone } = req.body;

    // Check if email or phone is already taken by another user
    if (email || phone) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: userId },
          [Op.or]: [
            email ? { email } : {},
            phone ? { phone } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      });

      if (existingUser) {
        throw new AppError('Email or phone already in use', 400);
      }
    }

    // Update User table
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();

    // Get updated customer profile
    const customer = await Customer.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/customer/addresses - List all addresses for customer
export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const addresses = await Address.findAll({
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/customer/addresses - Add new delivery address
export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { label, addressLine1, addressLine2, city, state, pincode, latitude, longitude, instructions } = req.body;

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      throw new AppError('Invalid pincode. Must be 6 digits', 400);
    }

    // Validate coordinates
    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const address = await Address.create({
      customerId: customer.id,
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      latitude,
      longitude,
      instructions,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/customer/addresses/:id - Update existing address
export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { label, addressLine1, addressLine2, city, state, pincode, latitude, longitude, instructions } = req.body;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const address = await Address.findOne({
      where: {
        id,
        customerId: customer.id,
      },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // Validate pincode if provided
    if (pincode && !/^\d{6}$/.test(pincode)) {
      throw new AppError('Invalid pincode. Must be 6 digits', 400);
    }

    // Update address fields
    if (label) address.label = label;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (latitude) address.latitude = latitude;
    if (longitude) address.longitude = longitude;
    if (instructions !== undefined) address.instructions = instructions;

    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/customer/addresses/:id - Delete address
export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const address = await Address.findOne({
      where: {
        id,
        customerId: customer.id,
      },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // Check if this is the only address and there are active orders
    const addressCount = await Address.count({ where: { customerId: customer.id } });
    if (addressCount === 1) {
      const { Order } = await import('@/models/postgres');
      const activeOrderCount = await Order.count({
        where: {
          customerId: customer.id,
          status: {
            [Op.in]: ['pending', 'restaurant_accepted', 'preparing', 'ready_for_pickup', 'delivery_partner_assigned', 'picked_up', 'out_for_delivery'],
          },
        },
      });

      if (activeOrderCount > 0) {
        throw new AppError('Cannot delete the only address while there are active orders', 400);
      }
    }

    await address.destroy();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/customer/wallet - Get wallet details
export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { customerId: customer.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Get last 20 transactions
    const transactions = await WalletTransaction.findAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        pendingAmount: wallet.pendingAmount,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/customer/wallet/transactions - Get wallet transaction history (paginated)
export const getWalletTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { customerId: customer.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const { count, rows: transactions } = await WalletTransaction.findAndCountAll({
      where: { walletId: wallet.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
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

// GET /v1/customer/loyalty - Get loyalty points details
export const getLoyalty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      where: { userId },
      attributes: ['id', 'loyaltyPoints'],
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get last 20 loyalty transactions
    const transactions = await LoyaltyTransaction.findAll({
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.status(200).json({
      success: true,
      data: {
        points: customer.loyaltyPoints,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/customer/loyalty/transactions - Get loyalty transaction history (paginated)
export const getLoyaltyTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const { count, rows: transactions } = await LoyaltyTransaction.findAndCountAll({
      where: { customerId: customer.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
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
