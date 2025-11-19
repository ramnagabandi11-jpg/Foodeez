import cron from 'node-cron';
import { Restaurant, Order, Payment, Wallet, WalletTransaction, DeliveryPartner, User } from '@/models/postgres';
import { Op } from 'sequelize';
import { logActivity } from '@/controllers/admin/activityLogsAdminController';

// ===== Scheduled Tasks =====

// Daily subscription billing scheduler - runs every day at 2 AM
export const subscriptionBillingScheduler = cron.schedule('0 2 * * *', async () => {
  console.log('Running daily subscription billing...');

  try {
    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Get all active restaurants
    const restaurants = await Restaurant.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    for (const restaurant of restaurants) {
      // Count deliveries for yesterday
      const deliveryCount = await Order.count({
        where: {
          restaurantId: restaurant.id,
          status: 'delivered',
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lte]: endOfYesterday,
          },
        },
      });

      // Calculate subscription tier
      let dailyRate = 0;
      let tier = 'No deliveries';

      if (deliveryCount >= 1 && deliveryCount <= 9) {
        tier = '1-9 deliveries/day';
        dailyRate = 99;
      } else if (deliveryCount >= 10 && deliveryCount <= 19) {
        tier = '10-19 deliveries/day';
        dailyRate = 199;
      } else if (deliveryCount >= 20 && deliveryCount <= 29) {
        tier = '20-29 deliveries/day';
        dailyRate = 299;
      } else if (deliveryCount >= 30 && deliveryCount <= 39) {
        tier = '30-39 deliveries/day';
        dailyRate = 399;
      } else if (deliveryCount >= 40 && deliveryCount <= 49) {
        tier = '40-49 deliveries/day';
        dailyRate = 499;
      } else if (deliveryCount >= 50) {
        tier = '50+ deliveries/day';
        dailyRate = 599;
      }

      // Check if subscription fee is waived
      const isWaived = restaurant.subscriptionFeeWaived || false;
      const amountToCharge = isWaived ? 0 : dailyRate;

      if (amountToCharge > 0) {
        // Find or create restaurant wallet
        let wallet = await Wallet.findOne({ where: { restaurantId: restaurant.id } });
        if (!wallet) {
          wallet = await Wallet.create({
            userId: restaurant.userId,
            restaurantId: restaurant.id,
            balance: 0,
          });
        }

        // Charge subscription fee
        const currentBalance = parseFloat(wallet.balance.toString());
        if (currentBalance >= amountToCharge) {
          // Create debit transaction
          await WalletTransaction.create({
            walletId: wallet.id,
            amount: -amountToCharge,
            transactionType: 'subscription',
            description: `Daily subscription charge for ${yesterday.toISOString().split('T')[0]} - ${tier} (${deliveryCount} deliveries)`,
            status: 'completed',
            metadata: {
              billingDate: yesterday.toISOString(),
              deliveryCount,
              tier,
              dailyRate,
              isWaived,
            },
          });

          // Update wallet balance
          wallet.balance = currentBalance - amountToCharge;
          await wallet.save();

          console.log(`Charged Rs. ${amountToCharge} to restaurant ${restaurant.name} (${tier})`);
        } else {
          // Insufficient balance - create pending transaction
          await WalletTransaction.create({
            walletId: wallet.id,
            amount: -amountToCharge,
            transactionType: 'subscription',
            description: `Pending subscription charge for ${yesterday.toISOString().split('T')[0]} - ${tier} (${deliveryCount} deliveries) - Insufficient balance`,
            status: 'pending',
            metadata: {
              billingDate: yesterday.toISOString(),
              deliveryCount,
              tier,
              dailyRate,
              isWaived,
              balanceDue: amountToCharge,
            },
          });

          console.log(`Pending subscription charge of Rs. ${amountToCharge} for restaurant ${restaurant.name} - Insufficient balance`);
        }
      }
    }

    console.log('Daily subscription billing completed');
  } catch (error) {
    console.error('Error in subscription billing scheduler:', error);
  }
}, {
  scheduled: false // Don't start automatically
});

// Daily settlements scheduler - runs every day at 3 AM
export const dailySettlementsScheduler = cron.schedule('0 3 * * *', async () => {
  console.log('Running daily settlements...');

  try {
    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Get all delivered orders from yesterday
    const orders = await Order.findAll({
      where: {
        status: 'delivered',
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lte]: endOfYesterday,
        },
      },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          include: [
            {
              model: Wallet,
              as: 'wallet',
            },
          ],
        },
      ],
    });

    // Group orders by restaurant
    const settlementsByRestaurant: any = {};

    orders.forEach((order) => {
      const restId = order.restaurantId;
      if (!settlementsByRestaurant[restId]) {
        settlementsByRestaurant[restId] = {
          restaurant: order.get('restaurant'),
          orders: [],
          totalRevenue: 0,
          totalCommission: 0,
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
      settlementsByRestaurant[restId].totalRevenue += orderAmount;
      settlementsByRestaurant[restId].totalCommission += commission;
      settlementsByRestaurant[restId].netSettlement += (orderAmount - commission);
    });

    // Process settlements for each restaurant
    for (const [restaurantId, settlement] of Object.entries(settlementsByRestaurant)) {
      const settlementData = settlement as any;

      if (settlementData.netSettlement > 0) {
        const wallet = settlementData.restaurant.wallet;

        if (wallet) {
          // Create credit transaction for net settlement
          await WalletTransaction.create({
            walletId: wallet.id,
            amount: settlementData.netSettlement,
            transactionType: 'settlement',
            description: `Daily settlement for ${yesterday.toISOString().split('T')[0]} - ${settlementData.orders.length} orders`,
            status: 'completed',
            metadata: {
              settlementDate: yesterday.toISOString(),
              orderCount: settlementData.orders.length,
              totalRevenue: settlementData.totalRevenue,
              totalCommission: settlementData.totalCommission,
              netSettlement: settlementData.netSettlement,
              orders: settlementData.orders,
            },
          });

          // Update wallet balance
          const currentBalance = parseFloat(wallet.balance.toString());
          wallet.balance = currentBalance + settlementData.netSettlement;
          await wallet.save();

          console.log(`Settled Rs. ${settlementData.netSettlement} to restaurant ${settlementData.restaurant.name}`);
        }
      }
    }

    console.log('Daily settlements completed');
  } catch (error) {
    console.error('Error in daily settlements scheduler:', error);
  }
}, {
  scheduled: false
});

// Analytics generation scheduler - runs every day at 4 AM
export const analyticsGenerationScheduler = cron.schedule('0 4 * * *', async () => {
  console.log('Generating daily analytics...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Generate restaurant performance analytics
    const restaurants = await Restaurant.findAll({
      include: [
        {
          model: Order,
          as: 'orders',
          where: {
            createdAt: {
              [Op.gte]: yesterday,
              [Op.lte]: endOfYesterday,
            },
          },
          required: false,
        },
      ],
    });

    const restaurantAnalytics = restaurants.map(restaurant => ({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date: yesterday.toISOString().split('T')[0],
      totalOrders: restaurant.orders?.length || 0,
      deliveredOrders: restaurant.orders?.filter((o: any) => o.status === 'delivered').length || 0,
      cancelledOrders: restaurant.orders?.filter((o: any) => ['cancelled_by_customer', 'cancelled_by_restaurant'].includes(o.status)).length || 0,
      totalRevenue: restaurant.orders?.filter((o: any) => o.status === 'delivered').reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount.toString()), 0) || 0,
    }));

    // Generate delivery partner performance analytics
    const deliveryPartners = await DeliveryPartner.findAll({
      include: [
        {
          model: Order,
          as: 'orders',
          where: {
            createdAt: {
              [Op.gte]: yesterday,
              [Op.lte]: endOfYesterday,
            },
          },
          required: false,
        },
      ],
    });

    const deliveryAnalytics = deliveryPartners.map(partner => ({
      deliveryPartnerId: partner.id,
      partnerName: partner.user?.name,
      date: yesterday.toISOString().split('T')[0],
      totalDeliveries: partner.orders?.filter((o: any) => o.status === 'delivered').length || 0,
      totalEarnings: partner.orders?.filter((o: any) => o.status === 'delivered').reduce((sum: number, o: any) => sum + parseFloat(o.deliveryFee?.toString() || '0'), 0) || 0,
      avgDeliveryTime: partner.orders?.filter((o: any) => o.status === 'delivered').reduce((sum: number, o: any) => sum + (o.actualDeliveryTime || 0), 0) / (partner.orders?.filter((o: any) => o.status === 'delivered').length || 1) || 0,
    }));

    // In a real system, these analytics would be stored in a database
    console.log(`Generated analytics for ${restaurantAnalytics.length} restaurants and ${deliveryAnalytics.length} delivery partners`);
    console.log('Daily analytics generation completed');
  } catch (error) {
    console.error('Error in analytics generation scheduler:', error);
  }
}, {
  scheduled: false
});

// Cleanup tasks scheduler - runs every Sunday at 1 AM
export const cleanupTasksScheduler = cron.schedule('0 1 * * 0', async () => {
  console.log('Running cleanup tasks...');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old pending wallet transactions (older than 30 days)
    const deletedTransactions = await WalletTransaction.destroy({
      where: {
        status: 'pending',
        createdAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    // Delete old activity logs (in-memory - would be different in production with database)
    if (global.activityLogs) {
      global.activityLogs = global.activityLogs.filter((log: any) =>
        new Date(log.timestamp) > thirtyDaysAgo
      );
    }

    // Archive old payment records if needed (in production, might move to archive table)
    const oldPayments = await Payment.findAll({
      where: {
        createdAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
      limit: 1000, // Process in batches
    });

    console.log(`Cleaned up ${deletedTransactions} old transactions and processed ${oldPayments.length} old payments`);
    console.log('Cleanup tasks completed');
  } catch (error) {
    console.error('Error in cleanup tasks scheduler:', error);
  }
}, {
  scheduled: false
});

// Function to start all schedulers
export function startAllSchedulers() {
  console.log('Starting all schedulers...');

  subscriptionBillingScheduler.start();
  dailySettlementsScheduler.start();
  analyticsGenerationScheduler.start();
  cleanupTasksScheduler.start();

  console.log('All schedulers started');
}

// Function to stop all schedulers
export function stopAllSchedulers() {
  console.log('Stopping all schedulers...');

  subscriptionBillingScheduler.stop();
  dailySettlementsScheduler.stop();
  analyticsGenerationScheduler.stop();
  cleanupTasksScheduler.stop();

  console.log('All schedulers stopped');
}

// Function to run scheduler manually for testing
export async function runSchedulerManually(schedulerName: string) {
  console.log(`Running ${schedulerName} manually...`);

  try {
    switch (schedulerName) {
      case 'subscription-billing':
        await subscriptionBillingScheduler.task();
        break;
      case 'daily-settlements':
        await dailySettlementsScheduler.task();
        break;
      case 'analytics-generation':
        await analyticsGenerationScheduler.task();
        break;
      case 'cleanup-tasks':
        await cleanupTasksScheduler.task();
        break;
      default:
        throw new Error(`Unknown scheduler: ${schedulerName}`);
    }

    console.log(`${schedulerName} completed successfully`);
  } catch (error) {
    console.error(`Error running ${schedulerName}:`, error);
    throw error;
  }
}