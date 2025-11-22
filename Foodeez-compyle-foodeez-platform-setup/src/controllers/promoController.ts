import { Request, Response, NextFunction } from 'express';
import { PromoCode, PromoCodeUsage, Customer, User } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/promo/available - Get available promo codes for customer
export const getAvailablePromos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { restaurantId, orderAmount } = req.query;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const now = new Date();

    // Find active promo codes
    const where: any = {
      isActive: true,
      validFrom: { [Op.lte]: now },
      validTo: { [Op.gte]: now },
    };

    // Filter by restaurant if provided
    if (restaurantId) {
      where[Op.or] = [
        { applicableFor: 'all' },
        { applicableFor: 'first_order' },
        { applicableFor: 'specific_restaurant', applicableRestaurantIds: { [Op.contains]: [restaurantId] } },
      ];
    } else {
      where.applicableFor = { [Op.in]: ['all', 'first_order'] };
    }

    const promoCodes = await PromoCode.findAll({ where });

    // Check eligibility for each promo code
    const eligiblePromos = [];

    for (const promo of promoCodes) {
      // Check if customer has already used this promo
      const usageCount = await PromoCodeUsage.count({
        where: {
          promoCodeId: promo.id,
          userId,
        },
      });

      // Check if promo is for first order only
      if (promo.applicableFor === 'first_order') {
        const orderCount = await customer.totalOrders;
        if (orderCount > 0) {
          continue; // Skip, not first order
        }
      }

      // Check usage limit
      if (promo.usageLimit !== null && usageCount >= promo.usageLimit) {
        continue; // Skip, limit reached
      }

      // Check total usage limit
      const totalUsage = await PromoCodeUsage.count({
        where: { promoCodeId: promo.id },
      });
      if (promo.maxUsageCount !== null && totalUsage >= promo.maxUsageCount) {
        continue; // Skip, max usage reached
      }

      // Calculate discount preview if orderAmount provided
      let discountAmount = 0;
      let finalAmount = 0;
      if (orderAmount) {
        const amount = parseFloat(orderAmount as string);
        if (promo.discountType === 'percentage') {
          discountAmount = (amount * promo.discountValue) / 100;
          if (promo.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
          }
        } else {
          discountAmount = promo.discountValue;
        }
        finalAmount = amount - discountAmount;
      }

      eligiblePromos.push({
        ...promo.toJSON(),
        discountPreview: orderAmount ? { discountAmount, finalAmount } : null,
      });
    }

    res.status(200).json({
      success: true,
      data: eligiblePromos,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/promo/validate - Validate promo code before order
export const validatePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { code, restaurantId, orderAmount } = req.body;

    const customer = await Customer.findOne({ where: { userId } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Find promo code
    const promo = await PromoCode.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!promo) {
      throw new AppError('Invalid or inactive promo code', 400);
    }

    // Check validity period
    const now = new Date();
    if (now < promo.validFrom || now > promo.validTo) {
      throw new AppError('Promo code is not valid at this time', 400);
    }

    // Check min order value
    if (promo.minOrderValue && orderAmount < promo.minOrderValue) {
      throw new AppError(`Minimum order value of Rs. ${promo.minOrderValue} required`, 400);
    }

    // Check customer usage limit
    const usageCount = await PromoCodeUsage.count({
      where: {
        promoCodeId: promo.id,
        userId,
      },
    });

    if (promo.usageLimit !== null && usageCount >= promo.usageLimit) {
      throw new AppError('You have reached the usage limit for this promo code', 400);
    }

    // Check total usage limit
    const totalUsage = await PromoCodeUsage.count({
      where: { promoCodeId: promo.id },
    });

    if (promo.maxUsageCount !== null && totalUsage >= promo.maxUsageCount) {
      throw new AppError('This promo code has reached its maximum usage limit', 400);
    }

    // Check if for first order only
    if (promo.applicableFor === 'first_order' && customer.totalOrders > 0) {
      throw new AppError('This promo code is only valid for first orders', 400);
    }

    // Check restaurant applicability
    if (promo.applicableFor === 'specific_restaurant') {
      if (!promo.applicableRestaurantIds || !promo.applicableRestaurantIds.includes(restaurantId)) {
        throw new AppError('This promo code is not applicable for this restaurant', 400);
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (orderAmount * promo.discountValue) / 100;
      if (promo.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
      }
    } else {
      discountAmount = promo.discountValue;
    }

    const finalAmount = orderAmount - discountAmount;

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        promoCode: promo,
        discountAmount,
        finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/promo - Create promo code (Admin only)
export const createPromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      validFrom,
      validTo,
      usageLimit,
      maxUsageCount,
      applicableFor,
      applicableRestaurantIds,
      description,
    } = req.body;

    // Check if code already exists
    const existing = await PromoCode.findOne({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      throw new AppError('Promo code already exists', 400);
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || null,
      maxDiscountAmount: maxDiscountAmount || null,
      validFrom,
      validTo,
      usageLimit: usageLimit || null,
      maxUsageCount: maxUsageCount || null,
      applicableFor: applicableFor || 'all',
      applicableRestaurantIds: applicableRestaurantIds || [],
      description: description || null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/promo/:id - Update promo code
export const updatePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const promo = await PromoCode.findByPk(id);
    if (!promo) {
      throw new AppError('Promo code not found', 404);
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'code') {
        // Don't allow code change
        (promo as any)[key] = updateData[key];
      }
    });

    await promo.save();

    res.status(200).json({
      success: true,
      message: 'Promo code updated successfully',
      data: promo,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /v1/promo/:id - Deactivate promo code
export const deactivatePromoCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const promo = await PromoCode.findByPk(id);
    if (!promo) {
      throw new AppError('Promo code not found', 404);
    }

    promo.isActive = false;
    await promo.save();

    res.status(200).json({
      success: true,
      message: 'Promo code deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/promo/:id/usage - Get promo code usage stats
export const getPromoUsageStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const promo = await PromoCode.findByPk(id);
    if (!promo) {
      throw new AppError('Promo code not found', 404);
    }

    // Get total usage count
    const totalUsage = await PromoCodeUsage.count({
      where: { promoCodeId: id },
    });

    // Get total discount given
    const usages = await PromoCodeUsage.findAll({
      where: { promoCodeId: id },
      attributes: ['discountAmount'],
    });

    const totalDiscountGiven = usages.reduce((sum, usage) => sum + parseFloat(usage.discountAmount.toString()), 0);

    // Get recent usages with order details
    const recentUsages = await PromoCodeUsage.findAll({
      where: { promoCodeId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.status(200).json({
      success: true,
      data: {
        promo,
        stats: {
          totalUsage,
          totalDiscountGiven,
          remainingUsage: promo.maxUsageCount ? promo.maxUsageCount - totalUsage : null,
        },
        recentUsages,
      },
    });
  } catch (error) {
    next(error);
  }
};
