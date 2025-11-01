import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import {
  Order,
  OrderItem,
  Customer,
  Restaurant,
  Address,
  Transaction,
  PromoCode,
  PromoCodeUsage,
  LoyaltyTransaction,
} from '@/models/postgres';
import { MenuItem } from '@/models/mongodb';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '@/utils/errors';
import { OrderStatus, PaymentMethod } from '@/types';
import { PAYMENT_CONFIG, ORDER_CONFIG } from '@/utils/constants';

/**
 * Calculate delivery fee based on distance
 */
const calculateDeliveryFee = (distance: number, isPremium: boolean): number => {
  let fee = PAYMENT_CONFIG.DELIVERY_BASE_FEE;

  if (distance > PAYMENT_CONFIG.DELIVERY_TIERS[0].maxDistance) {
    fee = PAYMENT_CONFIG.DELIVERY_TIERS[0].fee;
  }
  if (distance > PAYMENT_CONFIG.DELIVERY_TIERS[1].maxDistance) {
    fee = PAYMENT_CONFIG.DELIVERY_TIERS[1].fee;
  }
  if (distance > PAYMENT_CONFIG.DELIVERY_TIERS[2].maxDistance) {
    fee = PAYMENT_CONFIG.DELIVERY_TIERS[2].fee;
  }

  if (isPremium) {
    fee *= PAYMENT_CONFIG.PREMIUM_DELIVERY_MULTIPLIER;
  }

  return fee;
};

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Create a new order
 */
export const createOrder = async (data: {
  customerId: string;
  restaurantId: string;
  deliveryAddressId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: Record<string, any>;
    specialInstructions?: string;
  }>;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  loyaltyPointsUsed?: number;
  specialInstructions?: string;
  isPremiumDelivery?: boolean;
}): Promise<Order> => {
  const {
    customerId,
    restaurantId,
    deliveryAddressId,
    items,
    paymentMethod,
    promoCode,
    loyaltyPointsUsed = 0,
    specialInstructions,
    isPremiumDelivery = false,
  } = data;

  // Validate customer
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Validate restaurant
  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  if (!restaurant.isOpen) {
    throw new ValidationError('Restaurant is currently closed');
  }

  // Validate address
  const address = await Address.findByPk(deliveryAddressId);
  if (!address || address.customerId !== customerId) {
    throw new NotFoundError('Delivery address not found');
  }

  // Validate menu items and calculate totals
  let itemTotal = 0;
  const orderItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    basePrice: number;
    customizations: Record<string, any>;
    specialInstructions: string | null;
    subtotal: number;
  }> = [];

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItemId);
    if (!menuItem) {
      throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
    }

    if (!menuItem.isAvailable) {
      throw new ValidationError(`${menuItem.name} is currently unavailable`);
    }

    if (menuItem.restaurantId !== restaurantId) {
      throw new ValidationError(`${menuItem.name} does not belong to this restaurant`);
    }

    const subtotal = menuItem.price * item.quantity;
    itemTotal += subtotal;

    orderItems.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      basePrice: menuItem.price,
      customizations: item.customizations || {},
      specialInstructions: item.specialInstructions || null,
      subtotal,
    });
  }

  // Check minimum order value
  if (itemTotal < restaurant.minimumOrderValue) {
    throw new ValidationError(
      `Minimum order value is ₹${restaurant.minimumOrderValue}`
    );
  }

  // Calculate distance (simplified - in production use actual geocoding)
  const distance = 5; // km - TODO: Calculate actual distance
  const deliveryFee = calculateDeliveryFee(distance, isPremiumDelivery);

  // Calculate platform fee
  const platformFee = itemTotal * PAYMENT_CONFIG.PLATFORM_FEE_PERCENTAGE;

  // Calculate taxes
  const taxes = (itemTotal + deliveryFee) * PAYMENT_CONFIG.TAX_PERCENTAGE;

  // Apply promo code
  let discount = 0;
  if (promoCode) {
    const promo = await PromoCode.findOne({ where: { code: promoCode, isActive: true } });

    if (!promo) {
      throw new ValidationError('Invalid promo code');
    }

    if (new Date() < promo.validFrom || new Date() > promo.validUntil) {
      throw new ValidationError('Promo code expired');
    }

    if (itemTotal < promo.minOrderValue) {
      throw new ValidationError(`Minimum order value for this promo is ₹${promo.minOrderValue}`);
    }

    // Check usage limit
    const usageCount = await PromoCodeUsage.count({
      where: { promoCodeId: promo.id, userId: customer.userId },
    });

    if (usageCount >= promo.usageLimit) {
      throw new ValidationError('Promo code usage limit reached');
    }

    if (promo.discountType === 'percentage') {
      discount = itemTotal * (promo.discountValue / 100);
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else {
      discount = promo.discountValue;
    }
  }

  // Apply loyalty points
  let loyaltyDiscount = 0;
  if (loyaltyPointsUsed > 0) {
    if (loyaltyPointsUsed > customer.loyaltyPoints) {
      throw new ValidationError('Insufficient loyalty points');
    }
    loyaltyDiscount = loyaltyPointsUsed * PAYMENT_CONFIG.LOYALTY_REDEMPTION_VALUE;
  }

  const totalDiscount = discount + loyaltyDiscount;

  // Calculate total
  const totalAmount = Math.max(0, itemTotal + deliveryFee + platformFee + taxes - totalDiscount);

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerId,
    restaurantId,
    deliveryAddressId,
    status: 'placed',
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
    itemTotal,
    deliveryFee,
    platformFee,
    taxes,
    discount: totalDiscount,
    promoCode: promoCode || null,
    loyaltyPointsUsed,
    totalAmount,
    specialInstructions: specialInstructions || null,
    isPremiumDelivery,
    estimatedPreparationTime: restaurant.averagePreparationTime,
  });

  // Create order items
  for (const item of orderItems) {
    await OrderItem.create({
      orderId: order.id,
      ...item,
    });
  }

  // Record promo code usage
  if (promoCode) {
    const promo = await PromoCode.findOne({ where: { code: promoCode } });
    if (promo) {
      await PromoCodeUsage.create({
        promoCodeId: promo.id,
        userId: customer.userId,
        orderId: order.id,
        discountAmount: discount,
      });
      await promo.increment('currentUsageCount');
    }
  }

  // Deduct loyalty points
  if (loyaltyPointsUsed > 0) {
    await customer.decrement('loyaltyPoints', { by: loyaltyPointsUsed });
    await LoyaltyTransaction.create({
      customerId,
      orderId: order.id,
      type: 'redeemed',
      points: -loyaltyPointsUsed,
      description: `Redeemed for order ${order.orderNumber}`,
      balanceBefore: customer.loyaltyPoints,
      balanceAfter: customer.loyaltyPoints - loyaltyPointsUsed,
    });
  }

  // Increment customer total orders
  await customer.increment('totalOrders');

  return order;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  metadata?: Record<string, any>
): Promise<Order> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Update status-specific timestamps
  const updates: any = { status };

  if (status === 'restaurant_accepted') {
    updates.restaurantAcceptedAt = new Date();
  } else if (status === 'picked_up') {
    updates.pickedUpAt = new Date();
  } else if (status === 'delivered') {
    updates.deliveredAt = new Date();
    updates.actualDeliveryTime = new Date();
  } else if (status.startsWith('cancelled')) {
    updates.cancelledAt = new Date();
    if (metadata?.reason) {
      updates.cancellationReason = metadata.reason;
    }
  }

  await order.update(updates);

  // Award loyalty points on delivery
  if (status === 'delivered') {
    const customer = await Customer.findByPk(order.customerId);
    if (customer) {
      const pointsEarned = Math.floor(order.totalAmount * PAYMENT_CONFIG.LOYALTY_POINTS_PER_RUPEE);
      await customer.increment('loyaltyPoints', { by: pointsEarned });

      await LoyaltyTransaction.create({
        customerId: order.customerId,
        orderId: order.id,
        type: 'earned',
        points: pointsEarned,
        description: `Earned from order ${order.orderNumber}`,
        balanceBefore: customer.loyaltyPoints,
        balanceAfter: customer.loyaltyPoints + pointsEarned,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });
    }
  }

  return order;
};

/**
 * Get order details with relations
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  return await Order.findByPk(orderId, {
    include: [
      { model: OrderItem, as: 'items' },
      { model: Customer, as: 'customer' },
      { model: Restaurant, as: 'restaurant' },
      { model: Address, as: 'deliveryAddress' },
    ],
  });
};

/**
 * Get customer orders
 */
export const getCustomerOrders = async (
  customerId: string,
  options?: {
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ orders: Order[]; total: number }> => {
  const where: any = { customerId };

  if (options?.status) {
    where.status = options.status;
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      { model: Restaurant, as: 'restaurant' },
      { model: OrderItem, as: 'items' },
    ],
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    order: [['createdAt', 'DESC']],
  });

  return { orders: rows, total: count };
};

/**
 * Get restaurant orders
 */
export const getRestaurantOrders = async (
  restaurantId: string,
  options?: {
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ orders: Order[]; total: number }> => {
  const where: any = { restaurantId };

  if (options?.status) {
    where.status = options.status;
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer' },
      { model: OrderItem, as: 'items' },
      { model: Address, as: 'deliveryAddress' },
    ],
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    order: [['createdAt', 'DESC']],
  });

  return { orders: rows, total: count };
};

export default {
  createOrder,
  updateOrderStatus,
  getOrderById,
  getCustomerOrders,
  getRestaurantOrders,
};
