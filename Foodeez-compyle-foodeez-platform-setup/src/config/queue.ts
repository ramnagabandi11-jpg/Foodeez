import Bull, { Job, Queue } from 'bull';
import { createRedisClient } from '@/config/redis';
import {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPromotionalEmail,
  sendWelcomeEmail
} from '@/services/emailService';
import {
  emitOrderStatusUpdate,
  emitDeliveryRequest
} from '@/sockets';
import { Order } from '@/models/postgres';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'queue-service' },
  transports: [
    new winston.transports.File({ filename: 'queue-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'queue.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Queue configuration
export const emailQueue = new Bull('email processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
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

export const orderQueue = new Bull('order processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const analyticsQueue = new Bull('analytics processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

export const cleanupQueue = new Bull('cleanup tasks', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 30000,
    },
  },
});

// Email processing jobs
emailQueue.process('order-confirmation', async (job: Job) => {
  const { orderId, customerId, orderNumber, customerEmail } = job.data;

  try {
    logger.info(`Processing order confirmation email for order ${orderId}`);
    await sendOrderConfirmationEmail(orderId, customerEmail);
    logger.info(`Order confirmation email sent for order ${orderId}`);
  } catch (error) {
    logger.error(`Failed to send order confirmation email for order ${orderId}:`, error);
    throw error;
  }
});

emailQueue.process('order-status-update', async (job: Job) => {
  const { orderId, status, customerId, customerEmail } = job.data;

  try {
    logger.info(`Processing order status email for order ${orderId}, status: ${status}`);
    await sendOrderStatusEmail(orderId, status, customerEmail);
    logger.info(`Order status email sent for order ${orderId}, status: ${status}`);
  } catch (error) {
    logger.error(`Failed to send order status email for order ${orderId}:`, error);
    throw error;
  }
});

emailQueue.process('welcome-email', async (job: Job) => {
  const { customerName, customerEmail } = job.data;

  try {
    logger.info(`Sending welcome email to ${customerEmail}`);
    await sendWelcomeEmail(customerName, customerEmail);
    logger.info(`Welcome email sent to ${customerEmail}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${customerEmail}:`, error);
    throw error;
  }
});

emailQueue.process('promotional-email', async (job: Job) => {
  const { customers, promotion } = job.data;

  try {
    logger.info(`Sending promotional email to ${customers.length} customers`);
    for (const customer of customers) {
      await sendPromotionalEmail(customer.email, promotion);
    }
    logger.info(`Promotional email campaign sent to ${customers.length} customers`);
  } catch (error) {
    logger.error(`Failed to send promotional email:`, error);
    throw error;
  }
});

// Order processing jobs
orderQueue.process('delivery-partner-assignment', async (job: Job) => {
  const { orderId, restaurantId, deliveryAddress } = job.data;

  try {
    logger.info(`Processing delivery partner assignment for order ${orderId}`);

    // Find available delivery partners nearby (simplified logic)
    const availablePartners = await findAvailableDeliveryPartners(
      restaurantId,
      deliveryAddress
    );

    if (availablePartners.length > 0) {
      // Send delivery request to nearest available partner
      const nearestPartner = availablePartners[0];
      await emitDeliveryRequest(nearestPartner.id, {
        orderId,
        restaurantId,
        deliveryAddress,
      });

      logger.info(`Delivery request sent to partner ${nearestPartner.id} for order ${orderId}`);
    } else {
      // No delivery partners available, retry in 2 minutes
      await orderQueue.add('delivery-partner-assignment', job.data, {
        delay: 2 * 60 * 1000, // 2 minutes
        removeOnComplete: true,
      });

      logger.warn(`No delivery partners available for order ${orderId}, retrying in 2 minutes`);
    }
  } catch (error) {
    logger.error(`Failed to process delivery partner assignment for order ${orderId}:`, error);
    throw error;
  }
});

orderQueue.process('order-reminder', async (job: Job) => {
  const { orderId, restaurantId } = job.data;

  try {
    logger.info(`Processing order reminder for order ${orderId}`);

    // Check if order is still pending
    const order = await Order.findByPk(orderId);
    if (order && order.status === 'placed') {
      // Send reminder to restaurant
      emitOrderStatusUpdate(
        orderId,
        order.customerId,
        order.restaurantId,
        null,
        'placed',
        { reminder: true }
      );

      logger.info(`Order reminder sent for order ${orderId}`);
    }
  } catch (error) {
    logger.error(`Failed to process order reminder for order ${orderId}:`, error);
    throw error;
  }
});

// Analytics processing jobs
analyticsQueue.process('order-analytics', async (job: Job) => {
  const { orderId, orderData } = job.data;

  try {
    logger.info(`Processing analytics for order ${orderId}`);

    // Store order analytics in MongoDB
    const { OrderAnalytics } = await import('@/models/mongodb');
    await OrderAnalytics.create({
      orderId,
      restaurantId: orderData.restaurantId,
      customerId: orderData.customerId,
      orderAmount: orderData.totalAmount,
      itemCount: orderData.itemCount,
      orderTime: orderData.createdAt,
      deliveryTime: orderData.deliveredAt,
      orderType: orderData.isPremiumDelivery ? 'premium' : 'standard',
    });

    logger.info(`Analytics processed for order ${orderId}`);
  } catch (error) {
    logger.error(`Failed to process analytics for order ${orderId}:`, error);
    throw error;
  }
});

analyticsQueue.process('restaurant-performance', async (job: Job) => {
  const { restaurantId, dateRange } = job.data;

  try {
    logger.info(`Processing restaurant performance analytics for ${restaurantId}`);

    // Calculate restaurant performance metrics
    const { RestaurantAnalytics } = await import('@/models/mongodb');

    const analytics = await RestaurantAnalytics.aggregate([
      {
        $match: {
          restaurantId,
          date: {
            $gte: dateRange.start,
            $lte: dateRange.end,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: '$orderCount' },
          totalRevenue: { $sum: '$totalRevenue' },
          averageRating: { $avg: '$averageRating' },
          averagePreparationTime: { $avg: '$averagePreparationTime' },
        },
      },
    ]);

    if (analytics.length > 0) {
      const performance = analytics[0];

      // Update performance metrics (could be stored in Redis or database)
      await updateRestaurantPerformance(restaurantId, performance);

      logger.info(`Restaurant performance updated for ${restaurantId}`);
    }
  } catch (error) {
    logger.error(`Failed to process restaurant performance for ${restaurantId}:`, error);
    throw error;
  }
});

// Cleanup jobs
cleanupQueue.process('old-orders', async (job: Job) => {
  const { daysOld = 90 } = job.data;

  try {
    logger.info(`Cleaning up orders older than ${daysOld} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Archive old completed orders (simplified - in production, move to archive storage)
    const archivedOrders = await Order.update(
      { isArchived: true },
      {
        where: {
          status: ['delivered', 'cancelled'],
          createdAt: { [Op.lt]: cutoffDate },
          isArchived: false,
        },
      }
    );

    logger.info(`Archived ${archivedOrders[0]} old orders`);
  } catch (error) {
    logger.error(`Failed to cleanup old orders:`, error);
    throw error;
  }
});

cleanupQueue.process('expired-sessions', async (job: Job) => {
  try {
    logger.info(`Cleaning up expired sessions`);

    // Clean up expired Redis sessions
    const redis = await createRedisClient();
    const pattern = 'sess:*';
    const sessions = await redis.keys(pattern);

    let cleanedCount = 0;
    for (const sessionKey of sessions) {
      const ttl = await redis.ttl(sessionKey);
      if (ttl === -1) { // No expiry set
        await redis.expire(sessionKey, 24 * 60 * 60); // Set 24 hour expiry
        cleanedCount++;
      }
    }

    logger.info(`Cleaned up ${cleanedCount} expired sessions`);
  } catch (error) {
    logger.error(`Failed to cleanup expired sessions:`, error);
    throw error;
  }
});

// Helper functions (simplified implementations)
async function findAvailableDeliveryPartners(restaurantId: string, deliveryAddress: any) {
  // In production, this would use geolocation to find nearby delivery partners
  // For now, return mock data
  return [
    {
      id: 'partner-1',
      name: 'Delivery Partner 1',
      isAvailable: true,
      currentLocation: { latitude: 28.6139, longitude: 77.2090 },
    },
    {
      id: 'partner-2',
      name: 'Delivery Partner 2',
      isAvailable: true,
      currentLocation: { latitude: 28.6140, longitude: 77.2091 },
    },
  ];
}

async function updateRestaurantPerformance(restaurantId: string, performance: any) {
  // In production, this would update performance metrics in Redis or database
  logger.info(`Updated performance for ${restaurantId}:`, performance);
}

// Queue event handlers
emailQueue.on('completed', (job: Job, result: any) => {
  logger.info(`Email job completed: ${job.id}`, { result });
});

emailQueue.on('failed', (job: Job, err: Error) => {
  logger.error(`Email job failed: ${job.id}`, { error: err.message });
});

orderQueue.on('completed', (job: Job, result: any) => {
  logger.info(`Order job completed: ${job.id}`, { result });
});

orderQueue.on('failed', (job: Job, err: Error) => {
  logger.error(`Order job failed: ${job.id}`, { error: err.message });
});

analyticsQueue.on('completed', (job: Job, result: any) => {
  logger.info(`Analytics job completed: ${job.id}`, { result });
});

analyticsQueue.on('failed', (job: Job, err: Error) => {
  logger.error(`Analytics job failed: ${job.id}`, { error: err.message });
});

cleanupQueue.on('completed', (job: Job, result: any) => {
  logger.info(`Cleanup job completed: ${job.id}`, { result });
});

cleanupQueue.on('failed', (job: Job, err: Error) => {
  logger.error(`Cleanup job failed: ${job.id}`, { error: err.message });
});

export {
  emailQueue,
  orderQueue,
  analyticsQueue,
  cleanupQueue,
};