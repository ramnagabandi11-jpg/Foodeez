import { Request, Response, NextFunction } from 'express';
import { DeliveryPartner, Order, Restaurant, Address, Wallet, WalletTransaction, User, Customer } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';
import { getIO } from '@/sockets';

// GET /v1/delivery/profile - Get delivery partner profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const deliveryPartner = await DeliveryPartner.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveries = await Order.count({
      where: {
        deliveryPartnerId: deliveryPartner.id,
        status: 'delivered',
        deliveredAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...deliveryPartner.toJSON(),
        todayDeliveries,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/delivery/profile - Update profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { vehicleType, vehicleNumber, aadharNumber, bankDetails, photo } = req.body;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Update fields
    if (vehicleType) deliveryPartner.vehicleType = vehicleType;
    if (vehicleNumber) deliveryPartner.vehicleNumber = vehicleNumber;
    if (aadharNumber) deliveryPartner.aadharNumber = aadharNumber;
    if (bankDetails) deliveryPartner.bankDetails = bankDetails;
    if (photo) deliveryPartner.photo = photo;

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: deliveryPartner,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/delivery/status - Update online/offline status
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { isOnline, currentLatitude, currentLongitude } = req.body;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Check if required documents are verified before allowing online status
    if (isOnline && !deliveryPartner.isVerified) {
      throw new AppError('Profile must be verified before going online', 400);
    }

    deliveryPartner.isOnline = isOnline;
    if (currentLatitude) deliveryPartner.currentLatitude = currentLatitude;
    if (currentLongitude) deliveryPartner.currentLongitude = currentLongitude;
    deliveryPartner.lastActiveAt = new Date();

    await deliveryPartner.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${isOnline ? 'online' : 'offline'}`,
      data: {
        isOnline: deliveryPartner.isOnline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/delivery/available-orders - Get available orders for pickup
export const getAvailableOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      throw new AppError('Current location (latitude, longitude) is required', 400);
    }

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Get orders within 10 km radius that need delivery partner
    const orders = await Order.findAll({
      where: {
        status: 'ready_for_pickup',
        deliveryPartnerId: null,
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'phone'],
          required: true,
        },
        {
          model: Address,
          as: 'deliveryAddress',
          attributes: ['addressLine1', 'addressLine2', 'city', 'latitude', 'longitude'],
          required: true,
        },
      ],
      order: [['createdAt', 'ASC']],
      limit: 20,
    });

    // Calculate distance for each order and filter within radius
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    const ordersWithDistance = orders
      .map(order => {
        const restaurant = order.get('restaurant') as any;
        const distance = calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude);
        return {
          ...order.toJSON(),
          distance,
        };
      })
      .filter(order => order.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      data: ordersWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// POST /v1/delivery/orders/:orderId/accept - Accept delivery request
export const acceptDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    if (!deliveryPartner.isOnline) {
      throw new AppError('You must be online to accept deliveries', 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'ready_for_pickup') {
      throw new AppError('Order is not available for pickup', 400);
    }

    if (order.deliveryPartnerId) {
      throw new AppError('Order already assigned to another delivery partner', 400);
    }

    // Assign delivery partner
    order.deliveryPartnerId = deliveryPartner.id;
    order.status = 'delivery_partner_assigned';
    order.driverAcceptedAt = new Date();
    await order.save();

    // Emit Socket.io events
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'delivery_partner_assigned',
      deliveryPartner: {
        name: (await User.findByPk(userId))?.name,
        phone: (await User.findByPk(userId))?.phone,
      },
      message: 'Delivery partner assigned to your order',
    });

    io.to(`restaurant:${order.restaurantId}`).emit('delivery:assigned', {
      orderId: order.id,
      deliveryPartner: {
        id: deliveryPartner.id,
        name: (await User.findByPk(userId))?.name,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Delivery accepted successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/delivery/orders/:orderId/pickup - Mark order picked up from restaurant
export const markPickedUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      throw new AppError('OTP is required for pickup verification', 400);
    }

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        deliveryPartnerId: deliveryPartner.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'delivery_partner_assigned' && order.status !== 'ready_for_pickup') {
      throw new AppError('Order cannot be picked up in current status', 400);
    }

    // Verify OTP (in production, this would be a real OTP verification)
    // For now, just check if OTP is provided
    if (otp.length !== 4) {
      throw new AppError('Invalid OTP', 400);
    }

    order.status = 'picked_up';
    order.pickedUpAt = new Date();
    await order.save();

    // Emit Socket.io event to customer
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'picked_up',
      message: 'Your order has been picked up and is on the way',
    });

    res.status(200).json({
      success: true,
      message: 'Order marked as picked up',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/delivery/orders/:orderId/deliver - Mark order delivered to customer
export const markDelivered = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { otp, photo } = req.body;

    if (!otp) {
      throw new AppError('OTP is required for delivery verification', 400);
    }

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        deliveryPartnerId: deliveryPartner.id,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'picked_up') {
      throw new AppError('Order cannot be delivered in current status', 400);
    }

    // Verify OTP
    if (otp.length !== 4) {
      throw new AppError('Invalid OTP', 400);
    }

    // Calculate actual delivery time
    const now = new Date();
    const actualDeliveryTimeMinutes = order.driverAcceptedAt
      ? Math.round((now.getTime() - order.driverAcceptedAt.getTime()) / 60000)
      : null;

    order.status = 'delivered';
    order.deliveredAt = now;
    order.actualDeliveryTime = actualDeliveryTimeMinutes;
    if (photo) {
      order.deliveryProofPhoto = photo;
    }
    await order.save();

    // Emit Socket.io events
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:status', {
      orderId: order.id,
      status: 'delivered',
      deliveredAt: now,
      message: 'Your order has been delivered successfully',
    });

    io.to(`restaurant:${order.restaurantId}`).emit('order:delivered', {
      orderId: order.id,
      deliveredAt: now,
    });

    // TODO: Trigger settlement calculation

    res.status(200).json({
      success: true,
      message: 'Order marked as delivered',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/delivery/orders/active - Get current active delivery
export const getActiveDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const activeOrder = await Order.findOne({
      where: {
        deliveryPartnerId: deliveryPartner.id,
        status: {
          [Op.in]: ['delivery_partner_assigned', 'picked_up', 'out_for_delivery'],
        },
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'phone'],
        },
        {
          model: Address,
          as: 'deliveryAddress',
        },
        {
          model: Customer,
          as: 'customer',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'phone'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!activeOrder) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active delivery',
      });
    }

    res.status(200).json({
      success: true,
      data: activeOrder,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/delivery/orders/history - Get delivery history
export const getDeliveryHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status, date } = req.query;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const where: any = { deliveryPartnerId: deliveryPartner.id };

    if (status) {
      where.status = status;
    } else {
      // Default to completed/cancelled orders
      where.status = {
        [Op.in]: ['delivered', 'cancelled_by_customer', 'cancelled_by_restaurant'],
      };
    }

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
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address'],
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

// GET /v1/delivery/earnings - Get earnings summary
export const getEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    let { startDate, endDate } = req.query;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    // Default to current month
    if (!startDate || !endDate) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = start.toISOString().split('T')[0] as string;
      endDate = end.toISOString().split('T')[0] as string;
    }

    // Count completed deliveries
    const completedDeliveries = await Order.count({
      where: {
        deliveryPartnerId: deliveryPartner.id,
        status: 'delivered',
        deliveredAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      },
    });

    // Get wallet
    const wallet = await Wallet.findOne({
      where: { deliveryPartnerId: deliveryPartner.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Calculate earnings (sum of credit transactions in the date range)
    const transactions = await WalletTransaction.findAll({
      where: {
        walletId: wallet.id,
        transactionType: {
          [Op.in]: ['earning', 'settlement'],
        },
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      },
    });

    const totalEarnings = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    const avgPerDelivery = completedDeliveries > 0 ? totalEarnings / completedDeliveries : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        completedDeliveries,
        avgPerDelivery,
        pendingSettlements: wallet.pendingAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/delivery/earnings/transactions - Get earnings transaction history
export const getEarningsTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const wallet = await Wallet.findOne({
      where: { deliveryPartnerId: deliveryPartner.id },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: transactions } = await WalletTransaction.findAndCountAll({
      where: { walletId: wallet.id },
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

// GET /v1/delivery/navigation/:orderId - Get navigation details for order
export const getNavigation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const deliveryPartner = await DeliveryPartner.findOne({ where: { userId } });
    if (!deliveryPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        deliveryPartnerId: deliveryPartner.id,
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'phone'],
        },
        {
          model: Address,
          as: 'deliveryAddress',
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const restaurant = order.get('restaurant') as any;
    const deliveryAddress = order.get('deliveryAddress') as any;

    // Calculate distance
    const distanceToRestaurant = calculateDistance(
      deliveryPartner.currentLatitude!,
      deliveryPartner.currentLongitude!,
      restaurant.latitude,
      restaurant.longitude
    );

    const distanceToCustomer = calculateDistance(
      restaurant.latitude,
      restaurant.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    );

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          name: restaurant.name,
          address: restaurant.address,
          coordinates: {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          },
          phone: restaurant.phone,
          distance: distanceToRestaurant,
        },
        customer: {
          address: {
            addressLine1: deliveryAddress.addressLine1,
            addressLine2: deliveryAddress.addressLine2,
            city: deliveryAddress.city,
          },
          coordinates: {
            latitude: deliveryAddress.latitude,
            longitude: deliveryAddress.longitude,
          },
          distance: distanceToCustomer,
        },
        estimatedTotalDistance: distanceToRestaurant + distanceToCustomer,
      },
    });
  } catch (error) {
    next(error);
  }
};
