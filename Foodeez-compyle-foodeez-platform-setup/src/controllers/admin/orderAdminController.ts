import { Request, Response, NextFunction } from 'express';
import { Order, Customer, Restaurant, DeliveryPartner, User, Address, OrderItem } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';
import { getIO } from '@/sockets';

// GET /v1/admin/orders - List all orders
export const listOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, customerId, restaurantId, deliveryPartnerId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (restaurantId) where.restaurantId = restaurantId;
    if (deliveryPartnerId) where.deliveryPartnerId = deliveryPartnerId;

    if (startDate && endDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
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
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name'],
        },
        {
          model: DeliveryPartner,
          as: 'deliveryPartner',
          attributes: ['id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'phone'],
            },
          ],
          required: false,
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

// GET /v1/admin/orders/:id - Get order details
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone'],
            },
          ],
        },
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'phone'],
        },
        {
          model: DeliveryPartner,
          as: 'deliveryPartner',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'phone'],
            },
          ],
          required: false,
        },
        {
          model: Address,
          as: 'deliveryAddress',
        },
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Get timeline
    const timeline = [
      { event: 'Order Placed', timestamp: order.createdAt },
      order.restaurantAcceptedAt && { event: 'Restaurant Accepted', timestamp: order.restaurantAcceptedAt },
      order.readyForPickupAt && { event: 'Ready for Pickup', timestamp: order.readyForPickupAt },
      order.driverAcceptedAt && { event: 'Driver Accepted', timestamp: order.driverAcceptedAt },
      order.pickedUpAt && { event: 'Picked Up', timestamp: order.pickedUpAt },
      order.deliveredAt && { event: 'Delivered', timestamp: order.deliveredAt },
      order.cancelledAt && { event: 'Cancelled', timestamp: order.cancelledAt },
    ].filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        order,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/orders/:id/intervene - Manually update order status
export const interveneOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newStatus, reason } = req.body;
    const adminUserId = req.user?.id;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const previousStatus = order.status;
    order.status = newStatus;
    await order.save();

    // Log admin intervention
    // TODO: Create AdminActivityLog record

    // Emit Socket.io event
    const io = getIO();
    io.to(`order:${id}`).emit('order:status', {
      orderId: id,
      status: newStatus,
      message: `Order status updated by admin: ${reason}`,
      isAdminIntervention: true,
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: id,
        previousStatus,
        newStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/orders/:id/reassign-delivery - Reassign delivery partner
export const reassignDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newDeliveryPartnerId } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify new delivery partner exists
    const newPartner = await DeliveryPartner.findByPk(newDeliveryPartnerId);
    if (!newPartner) {
      throw new AppError('Delivery partner not found', 404);
    }

    const previousPartnerId = order.deliveryPartnerId;
    order.deliveryPartnerId = newDeliveryPartnerId;
    await order.save();

    // Emit Socket.io events
    const io = getIO();

    // Notify new delivery partner
    io.to(`delivery:${newDeliveryPartnerId}`).emit('order:assigned', {
      orderId: id,
      message: 'You have been assigned a new delivery',
    });

    // Notify customer
    io.to(`order:${id}`).emit('delivery:reassigned', {
      orderId: id,
      message: 'Your delivery partner has been changed',
    });

    res.status(200).json({
      success: true,
      message: 'Delivery partner reassigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/orders/:id/refund - Process refund
export const processRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // TODO: Call payment service refund logic
    // For now, just update order status
    if (order.status !== 'cancelled_by_customer' && order.status !== 'cancelled_by_restaurant') {
      order.status = 'cancelled_by_admin';
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId: id,
        refundAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};
