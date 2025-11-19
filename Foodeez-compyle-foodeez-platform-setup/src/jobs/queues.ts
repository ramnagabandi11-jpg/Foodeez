import Bull from 'bull';
import { config } from '@/config';
import { Order, Payment, Wallet, WalletTransaction, User, Notification } from '@/models/postgres';
import Address from '@/models/postgres/Address';
import { sendEmail, sendSMS } from '@/services/notificationService';
import { logActivity } from '@/controllers/admin/activityLogsAdminController';

// Redis configuration
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

// ===== Job Queues =====

// Notification Queue - handles all email/SMS notifications
export const notificationQueue = new Bull('notification queue', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Payment Processing Queue - handles payment processing and refunds
export const paymentProcessingQueue = new Bull('payment processing queue', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Order Processing Queue - handles order-related background tasks
export const orderProcessingQueue = new Bull('order processing queue', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Analytics Queue - handles background analytics calculations
export const analyticsQueue = new Bull('analytics queue', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// ===== Notification Queue Processors =====

notificationQueue.process('send-email', async (job) => {
  const { to, subject, template, data, userId } = job.data;

  try {
    await sendEmail(to, subject, template, data);

    // Log the activity if userId is provided
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        logActivity(
          userId,
          user.role,
          user.name,
          'Email Sent',
          'notification',
          undefined,
          { to, subject, template },
          { jobId: job.id },
          'low'
        );
      }
    }

    console.log(`Email sent successfully to ${to}`);
    return { success: true, to, subject };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
});

notificationQueue.process('send-sms', async (job) => {
  const { to, message, userId } = job.data;

  try {
    await sendSMS(to, message);

    // Log the activity if userId is provided
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        logActivity(
          userId,
          user.role,
          user.name,
          'SMS Sent',
          'notification',
          undefined,
          { to, message: message.substring(0, 100) },
          { jobId: job.id },
          'low'
        );
      }
    }

    console.log(`SMS sent successfully to ${to}`);
    return { success: true, to };
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
    throw error;
  }
});

notificationQueue.process('push-notification', async (job) => {
  const { userId, title, message, data, notificationId } = job.data;

  try {
    // In a real implementation, this would use a push notification service like Firebase
    console.log(`Push notification sent to user ${userId}: ${title} - ${message}`);

    // Update notification status if notificationId is provided
    if (notificationId) {
      await Notification.update(
        { status: 'sent', sentAt: new Date() },
        { where: { id: notificationId } }
      );
    }

    return { success: true, userId, title };
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
    throw error;
  }
});

// ===== Payment Processing Queue Processors =====

paymentProcessingQueue.process('process-payment', async (job) => {
  const { paymentId, orderId, amount, paymentMethod } = job.data;

  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // In a real implementation, this would integrate with payment gateway (Razorpay)
    const paymentResult = {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gatewayResponse: { status: 'captured' },
    };

    if (paymentResult.success) {
      // Update payment record
      await payment.update({
        status: 'success',
        gatewayTransactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
      });

      // Update order status
      const order = await Order.findByPk(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        await order.save();
      }

      console.log(`Payment processed successfully: ${paymentId}`);
      return { success: true, paymentId, transactionId: paymentResult.transactionId };
    } else {
      throw new Error('Payment processing failed');
    }
  } catch (error) {
    console.error(`Payment processing failed for ${paymentId}:`, error);

    // Update payment status to failed
    await Payment.update(
      { status: 'failed', gatewayResponse: { error: error.message } },
      { where: { id: paymentId } }
    );

    throw error;
  }
});

paymentProcessingQueue.process('process-refund', async (job) => {
  const { paymentId, refundAmount, reason, userId } = job.data;

  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // In a real implementation, this would initiate refund with payment gateway
    const refundResult = {
      success: true,
      refundId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refundAmount,
      status: 'processed',
    };

    if (refundResult.success) {
      // Get customer wallet
      const order = await Order.findByPk(payment.orderId, {
        include: [
          {
            model: User,
            as: 'customer',
          },
        ],
      });

      if (order?.customer) {
        let wallet = await Wallet.findOne({ where: { userId: order.customerId } });
        if (!wallet) {
          wallet = await Wallet.create({
            userId: order.customerId,
            balance: 0,
          });
        }

        // Create credit transaction for refund
        await WalletTransaction.create({
          walletId: wallet.id,
          amount: refundAmount,
          transactionType: 'refund',
          description: `Refund for order ${order.orderNumber}: ${reason}`,
          status: 'completed',
          metadata: {
            refundId: refundResult.refundId,
            paymentId,
            orderId: payment.orderId,
            refundReason: reason,
            processedBy: userId,
          },
        });

        // Update wallet balance
        wallet.balance = parseFloat(wallet.balance.toString()) + refundAmount;
        await wallet.save();

        // Send refund confirmation notification
        await notificationQueue.add('send-email', {
          to: order.customer.email,
          subject: 'Refund Processed - Foodeez',
          template: 'refund-confirmation',
          data: {
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
            refundAmount,
            reason,
            refundId: refundResult.refundId,
          },
          userId: order.customerId,
        });

        console.log(`Refund processed successfully: ${refundResult.refundId}`);
        return { success: true, refundId: refundResult.refundId, refundAmount };
      }
    } else {
      throw new Error('Refund processing failed');
    }
  } catch (error) {
    console.error(`Refund processing failed for payment ${paymentId}:`, error);
    throw error;
  }
});

// ===== Order Processing Queue Processors =====

orderProcessingQueue.process('auto-cancel-orders', async (job) => {
  const { timeInMinutes = 30 } = job.data;

  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeInMinutes);

    // Find pending orders older than cutoff time
    const pendingOrders = await Order.findAll({
      where: {
        status: 'pending',
        createdAt: {
          [Op.lt]: cutoffTime,
        },
      },
      include: [
        {
          model: User,
          as: 'customer',
        },
        {
          model: Restaurant,
          as: 'restaurant',
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
        },
      ],
    });

    for (const order of pendingOrders) {
      // Update order status
      order.status = 'cancelled_by_admin';
      order.cancellationReason = 'Auto-cancelled due to timeout';
      order.cancelledAt = new Date();
      await order.save();

      // Send notifications
      if (order.customer) {
        await notificationQueue.add('send-email', {
          to: order.customer.email,
          subject: 'Order Auto-cancelled - Foodeez',
          template: 'order-auto-cancelled',
          data: {
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
            restaurantName: order.get('restaurant')?.name,
            cancellationReason: order.cancellationReason,
          },
          userId: order.customerId,
        });
      }

      // Process refund if payment was made
      if (order.paymentStatus === 'paid') {
        const payment = await Payment.findOne({
          where: {
            orderId: order.id,
            status: 'success',
          },
        });

        if (payment) {
          await paymentProcessingQueue.add('process-refund', {
            paymentId: payment.id,
            refundAmount: parseFloat(order.totalAmount.toString()),
            reason: 'Order auto-cancelled due to timeout',
            userId: 'system',
          });
        }
      }
    }

    console.log(`Auto-cancelled ${pendingOrders.length} pending orders`);
    return { success: true, cancelledOrders: pendingOrders.length };
  } catch (error) {
    console.error('Error in auto-cancel orders job:', error);
    throw error;
  }
});

orderProcessingQueue.process('assign-delivery-partners', async (job) => {
  const { maxRadius = 10 } = job.data; // in kilometers

  try {
    // Find orders ready for pickup without delivery partner
    const readyOrders = await Order.findAll({
      where: {
        status: 'ready_for_pickup',
        deliveryPartnerId: null,
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
        },
        {
          model: Address,
          as: 'deliveryAddress',
        },
      ],
    });

    for (const order of readyOrders) {
      // Find nearby available delivery partners
      const nearbyPartners = await findNearbyDeliveryPartners(
        order.get('restaurant')?.latitude || 0,
        order.get('restaurant')?.longitude || 0,
        maxRadius
      );

      if (nearbyPartners.length > 0) {
        // Assign to the closest partner
        const assignedPartner = nearbyPartners[0];

        // Update order
        order.deliveryPartnerId = assignedPartner.id;
        order.status = 'driver_assigned';
        order.driverAssignedAt = new Date();
        await order.save();

        // Send notification to delivery partner
        await notificationQueue.add('push-notification', {
          userId: assignedPartner.userId,
          title: 'New Order Assigned',
          message: `Order #${order.orderNumber} assigned to you for pickup`,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantName: order.get('restaurant')?.name,
          },
        });

        console.log(`Order ${order.orderNumber} assigned to delivery partner ${assignedPartner.user?.name}`);
      }
    }

    console.log(`Processed ${readyOrders.length} orders for delivery partner assignment`);
    return { success: true, processedOrders: readyOrders.length };
  } catch (error) {
    console.error('Error in assign delivery partners job:', error);
    throw error;
  }
});

// ===== Analytics Queue Processors =====

analyticsQueue.process('calculate-daily-metrics', async (job) => {
  const { date = new Date().toISOString().split('T')[0] } = job.data;

  try {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Calculate order metrics
    const totalOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    const completedOrders = await Order.count({
      where: {
        status: 'delivered',
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        status: 'delivered',
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    // Calculate user metrics
    const newCustomers = await User.count({
      where: {
        role: 'customer',
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    const newRestaurants = await User.count({
      where: {
        role: 'restaurant',
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    const metrics = {
      date,
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: totalOrders - completedOrders,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      },
      revenue: {
        total: totalRevenue || 0,
        averageOrderValue: completedOrders > 0 ? (totalRevenue || 0) / completedOrders : 0,
      },
      users: {
        newCustomers,
        newRestaurants,
      },
    };

    console.log(`Daily metrics calculated for ${date}:`, metrics);
    return { success: true, date, metrics };
  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    throw error;
  }
});

// ===== Helper Functions =====

async function findNearbyDeliveryPartners(latitude: number, longitude: number, radiusKm: number) {
  // In a real implementation, this would use geospatial queries
  // For now, we'll return a simple mock implementation

  const availablePartners = await DeliveryPartner.findAll({
    where: {
      isActive: true,
      isOnline: true,
    },
    include: [
      {
        model: User,
        as: 'user',
      },
    ],
  });

  // Sort by distance (mock implementation - would use proper geospatial calculation)
  return availablePartners.sort((a, b) => {
    const distanceA = Math.random() * radiusKm; // Mock distance
    const distanceB = Math.random() * radiusKm; // Mock distance
    return distanceA - distanceB;
  });
}

// ===== Queue Event Handlers =====

// Log queue events for monitoring
notificationQueue.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed: ${job.name}`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed: ${job.name}`, err);
});

paymentProcessingQueue.on('completed', (job) => {
  console.log(`Payment processing job ${job.id} completed: ${job.name}`);
});

paymentProcessingQueue.on('failed', (job, err) => {
  console.error(`Payment processing job ${job.id} failed: ${job.name}`, err);
});

orderProcessingQueue.on('completed', (job) => {
  console.log(`Order processing job ${job.id} completed: ${job.name}`);
});

orderProcessingQueue.on('failed', (job, err) => {
  console.error(`Order processing job ${job.id} failed: ${job.name}`, err);
});

// ===== Queue Management Functions =====

export async function getQueueStats() {
  const [notificationWaiting, notificationActive, notificationCompleted, notificationFailed] =
    await Promise.all([
      notificationQueue.getWaiting(),
      notificationQueue.getActive(),
      notificationQueue.getCompleted(),
      notificationQueue.getFailed(),
    ]);

  const [paymentWaiting, paymentActive, paymentCompleted, paymentFailed] =
    await Promise.all([
      paymentProcessingQueue.getWaiting(),
      paymentProcessingQueue.getActive(),
      paymentProcessingQueue.getCompleted(),
      paymentProcessingQueue.getFailed(),
    ]);

  const [orderWaiting, orderActive, orderCompleted, orderFailed] =
    await Promise.all([
      orderProcessingQueue.getWaiting(),
      orderProcessingQueue.getActive(),
      orderProcessingQueue.getCompleted(),
      orderProcessingQueue.getFailed(),
    ]);

  return {
    notification: {
      waiting: notificationWaiting.length,
      active: notificationActive.length,
      completed: notificationCompleted.length,
      failed: notificationFailed.length,
    },
    paymentProcessing: {
      waiting: paymentWaiting.length,
      active: paymentActive.length,
      completed: paymentCompleted.length,
      failed: paymentFailed.length,
    },
    orderProcessing: {
      waiting: orderWaiting.length,
      active: orderActive.length,
      completed: orderCompleted.length,
      failed: orderFailed.length,
    },
  };
}

export async function pauseAllQueues() {
  await Promise.all([
    notificationQueue.pause(),
    paymentProcessingQueue.pause(),
    orderProcessingQueue.pause(),
    analyticsQueue.pause(),
  ]);
  console.log('All queues paused');
}

export async function resumeAllQueues() {
  await Promise.all([
    notificationQueue.resume(),
    paymentProcessingQueue.resume(),
    orderProcessingQueue.resume(),
    analyticsQueue.resume(),
  ]);
  console.log('All queues resumed');
}

export async function clearAllQueues() {
  await Promise.all([
    notificationQueue.clean(0, 'completed'),
    notificationQueue.clean(0, 'failed'),
    paymentProcessingQueue.clean(0, 'completed'),
    paymentProcessingQueue.clean(0, 'failed'),
    orderProcessingQueue.clean(0, 'completed'),
    orderProcessingQueue.clean(0, 'failed'),
    analyticsQueue.clean(0, 'completed'),
    analyticsQueue.clean(0, 'failed'),
  ]);
  console.log('All queues cleared');
}