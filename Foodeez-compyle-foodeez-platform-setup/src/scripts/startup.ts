import { createIndices, rebuildAllIndices, bulkIndexRestaurants, bulkIndexMenuItems } from '@/config/elasticsearchIndices';
import { emailQueue, orderQueue, analyticsQueue, cleanupQueue } from '@/config/queue';
import { testEmailConfiguration } from '@/services/emailService';
import { logger } from '@/config/monitoring';

/**
 * Initialize services on startup
 */
export const initializeServices = async () => {
  try {
    logger.info('Starting application initialization...');

    // Step 1: Initialize Elasticsearch indices
    logger.info('Step 1: Initializing Elasticsearch indices...');
    await createIndices();
    logger.info('✓ Elasticsearch indices created');

    // Step 2: Index existing data in Elasticsearch
    logger.info('Step 2: Indexing existing data...');
    try {
      await bulkIndexRestaurants();
      await bulkIndexMenuItems();
      logger.info('✓ Data indexing completed');
    } catch (error) {
      logger.warn('Data indexing failed (might be first run):', error);
    }

    // Step 3: Test email configuration
    logger.info('Step 3: Testing email configuration...');
    const emailConfigured = await testEmailConfiguration();
    if (emailConfigured) {
      logger.info('✓ Email configuration tested successfully');
    } else {
      logger.warn('Email configuration test failed');
    }

    // Step 4: Initialize queue processors
    logger.info('Step 4: Initializing queue processors...');

    // Queue processor counts (adjust based on your needs)
    const emailProcessorCount = parseInt(process.env.EMAIL_QUEUE_PROCESSORS || '2');
    const orderProcessorCount = parseInt(process.env.ORDER_QUEUE_PROCESSORS || '3');
    const analyticsProcessorCount = parseInt(process.env.ANALYTICS_QUEUE_PROCESSORS || '2');
    const cleanupProcessorCount = parseInt(process.env.CLEANUP_QUEUE_PROCESSORS || '1');

    // Start email queue processors
    for (let i = 0; i < emailProcessorCount; i++) {
      emailQueue.process('order-confirmation', require('@/services/emailService').sendOrderConfirmationEmail);
      emailQueue.process('order-status-update', require('@/services/emailService').sendOrderStatusEmail);
      emailQueue.process('welcome-email', require('@/services/emailService').sendWelcomeEmail);
      emailQueue.process('promotional-email', require('@/services/emailService').sendPromotionalEmail);
    }

    // Start order queue processors
    for (let i = 0; i < orderProcessorCount; i++) {
      orderQueue.process('delivery-partner-assignment', require('@/config/queue').processDeliveryPartnerAssignment);
      orderQueue.process('order-reminder', require('@/config/queue').processOrderReminder);
    }

    // Start analytics queue processors
    for (let i = 0; i < analyticsProcessorCount; i++) {
      analyticsQueue.process('order-analytics', require('@/config/queue').processOrderAnalytics);
      analyticsQueue.process('restaurant-performance', require('@/config/queue').processRestaurantPerformance);
    }

    // Start cleanup queue processors
    for (let i = 0; i < cleanupProcessorCount; i++) {
      cleanupQueue.process('old-orders', require('@/config/queue').processOldOrdersCleanup);
      cleanupQueue.process('expired-sessions', require('@/config/queue').processExpiredSessions);
    }

    logger.info(`✓ Queue processors started (Email: ${emailProcessorCount}, Order: ${orderProcessorCount}, Analytics: ${analyticsProcessorCount}, Cleanup: ${cleanupProcessorCount})`);

    // Step 5: Schedule recurring jobs
    logger.info('Step 5: Scheduling recurring jobs...');
    await scheduleRecurringJobs();
    logger.info('✓ Recurring jobs scheduled');

    logger.info('✓ Application initialization completed successfully');

  } catch (error) {
    logger.error('Application initialization failed:', error);
    throw error;
  }
};

/**
 * Schedule recurring background jobs
 */
const scheduleRecurringJobs = async () => {
  const cron = require('node-cron');

  // Daily cleanup job at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily cleanup job...');
    cleanupQueue.add('old-orders', { daysOld: 90 }, {
      removeOnComplete: true,
    });

    cleanupQueue.add('expired-sessions', {}, {
      removeOnComplete: true,
    });
  });

  // Weekly analytics processing on Sunday at 1 AM
  cron.schedule('0 1 * * 0', async () => {
    logger.info('Running weekly analytics processing...');

    // Process restaurant performance for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    analyticsQueue.add('restaurant-performance', {
      dateRange: { start: startDate, end: endDate },
    }, {
      removeOnComplete: true,
    });
  });

  // Hourly queue health check
  cron.schedule('0 * * * *', async () => {
    logger.debug('Running queue health check...');

    try {
      const emailWaiting = await emailQueue.getWaiting();
      const orderWaiting = await orderQueue.getWaiting();
      const analyticsWaiting = await analyticsQueue.getWaiting();
      const cleanupWaiting = await cleanupQueue.getWaiting();

      const totalWaiting = emailWaiting.length + orderWaiting.length + analyticsWaiting.length + cleanupWaiting.length;

      if (totalWaiting > 1000) {
        logger.warn('High queue backlog detected', {
          emailQueue: emailWaiting.length,
          orderQueue: orderWaiting.length,
          analyticsQueue: analyticsWaiting.length,
          cleanupQueue: cleanupWaiting.length,
          total: totalWaiting,
        });
      }
    } catch (error) {
      logger.error('Queue health check failed:', error);
    }
  });

  // Elasticsearch optimization job (weekly on Sunday at 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Running Elasticsearch optimization...');
    try {
      const { optimizeIndices } = await import('@/config/elasticsearchIndices');
      await optimizeIndices();
    } catch (error) {
      logger.error('Elasticsearch optimization failed:', error);
    }
  });
};

/**
 * Graceful shutdown handler
 */
export const setupGracefulShutdown = (server: any) => {
  const shutdown = async (signal: string) => {
    logger.info(`\nReceived ${signal}, starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close queue connections
          await Promise.all([
            emailQueue.close(),
            orderQueue.close(),
            analyticsQueue.close(),
            cleanupQueue.close(),
          ]);
          logger.info('Queue connections closed');

          // Close database connections would go here
          // await disconnectDatabase();
          // await disconnectMongoDB();

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);

    } catch (error) {
      logger.error('Error during shutdown initiation:', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Optional: Rebuild search indices (for maintenance/updates)
 */
export const rebuildSearchIndices = async () => {
  try {
    logger.info('Starting search indices rebuild...');
    await rebuildAllIndices();
    logger.info('Search indices rebuild completed');
  } catch (error) {
    logger.error('Search indices rebuild failed:', error);
    throw error;
  }
};

// Export for use in main server file
export default {
  initializeServices,
  setupGracefulShutdown,
  rebuildSearchIndices,
};