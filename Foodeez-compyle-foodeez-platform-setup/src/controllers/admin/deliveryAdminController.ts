import { Request, Response, NextFunction } from 'express';
import { DeliveryPartner, User, Order, Wallet } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/delivery-partners - List all delivery partners
export const listDeliveryPartners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, city, isOnline, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (city) where.city = city;
    if (isOnline !== undefined) where.isOnline = isOnline === 'true';

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: partners } = await DeliveryPartner.findAndCountAll({
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

    // Get stats for each partner
    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const totalDeliveries = await Order.count({
          where: {
            deliveryPartnerId: partner.id,
            status: 'delivered',
          },
        });

        const wallet = await Wallet.findOne({
          where: { deliveryPartnerId: partner.id },
        });

        return {
          ...partner.toJSON(),
          stats: {
            totalDeliveries,
            earnings: wallet?.balance || 0,
            rating: partner.rating,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        deliveryPartners: partnersWithStats,
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

// GET /v1/admin/delivery-partners/:id - Get delivery partner details
export const getDeliveryPartnerDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const partner = await DeliveryPartner.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
        },
      ],
    });

    if (!partner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Get performance metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.findAll({
      where: {
        deliveryPartnerId: id,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: ['status', 'deliveryFee', 'actualDeliveryTime'],
    });

    const completedDeliveries = orders.filter(o => o.status === 'delivered');
    const totalEarnings = completedDeliveries.reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);
    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, o) => sum + (o.actualDeliveryTime || 0), 0) / completedDeliveries.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        partner,
        performanceMetrics: {
          last30Days: {
            totalOrders: orders.length,
            completedDeliveries: completedDeliveries.length,
            totalEarnings,
            avgDeliveryTime: Math.round(avgDeliveryTime),
            completionRate: orders.length > 0 ? (completedDeliveries.length / orders.length) * 100 : 0,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/delivery-partners - Onboard delivery partner
export const onboardDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      vehicleType,
      vehicleNumber,
      aadharNumber,
      city,
      documents,
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
      password, // Should be hashed in User model
      role: 'delivery_partner',
      isActive: true,
    });

    // Create delivery partner
    const partner = await DeliveryPartner.create({
      userId: user.id,
      vehicleType,
      vehicleNumber,
      aadharNumber,
      city,
      documents: documents || {},
      isVerified: false,
      isActive: true,
      isOnline: false,
      rating: 0,
      totalDeliveries: 0,
    });

    // Create wallet
    await Wallet.create({
      userId: user.id,
      deliveryPartnerId: partner.id,
      balance: 0,
      pendingAmount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Delivery partner onboarded successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        partner,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/delivery-partners/:id - Update delivery partner
export const updateDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const partner = await DeliveryPartner.findByPk(id);
    if (!partner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        (partner as any)[key] = updateData[key];
      }
    });

    await partner.save();

    res.status(200).json({
      success: true,
      message: 'Delivery partner updated successfully',
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/delivery-partners/:id/verify - Verify documents
export const verifyDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isVerified, verificationNotes } = req.body;

    const partner = await DeliveryPartner.findByPk(id);
    if (!partner) {
      throw new AppError('Delivery partner not found', 404);
    }

    partner.isVerified = isVerified;
    if (verificationNotes) {
      partner.verificationNotes = verificationNotes;
    }

    await partner.save();

    // TODO: Send notification to delivery partner

    res.status(200).json({
      success: true,
      message: `Delivery partner ${isVerified ? 'verified' : 'verification rejected'} successfully`,
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/delivery-partners/:id/status - Activate/suspend delivery partner
export const updateDeliveryPartnerStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const partner = await DeliveryPartner.findByPk(id);
    if (!partner) {
      throw new AppError('Delivery partner not found', 404);
    }

    partner.isActive = status === 'active';
    await partner.save();

    // TODO: Send notification

    res.status(200).json({
      success: true,
      message: `Delivery partner ${status === 'active' ? 'activated' : 'suspended'} successfully`,
      data: partner,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/delivery-partners/:id/performance - View performance metrics
export const getPerformanceMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let { startDate, endDate } = req.query;

    const partner = await DeliveryPartner.findByPk(id);
    if (!partner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Default to last 30 days
    if (!startDate || !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      startDate = start.toISOString().split('T')[0] as string;
      endDate = end.toISOString().split('T')[0] as string;
    }

    const orders = await Order.findAll({
      where: {
        deliveryPartnerId: id,
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      },
      attributes: ['status', 'deliveryFee', 'actualDeliveryTime', 'createdAt'],
    });

    const completedDeliveries = orders.filter(o => o.status === 'delivered');
    const totalEarnings = completedDeliveries.reduce((sum, o) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0);
    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, o) => sum + (o.actualDeliveryTime || 0), 0) / completedDeliveries.length
      : 0;

    // Group by date for chart data
    const dailyStats: any = {};
    completedDeliveries.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { deliveries: 0, earnings: 0 };
      }
      dailyStats[date].deliveries++;
      dailyStats[date].earnings += parseFloat(order.deliveryFee?.toString() || '0');
    });

    res.status(200).json({
      success: true,
      data: {
        partner: {
          id: partner.id,
          name: (await User.findByPk(partner.userId))?.name,
        },
        summary: {
          totalOrders: orders.length,
          completedDeliveries: completedDeliveries.length,
          totalEarnings,
          avgDeliveryTime: Math.round(avgDeliveryTime),
          rating: partner.rating,
        },
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...(stats as any),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
