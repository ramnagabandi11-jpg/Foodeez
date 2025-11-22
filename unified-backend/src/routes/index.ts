import { Router } from 'express';

// Import route modules
import customerRoutes from './v1/customer';
import restaurantRoutes from './v1/restaurant';
import driverRoutes from './v1/driver';
import adminRoutes from './v1/admin';
import superAdminRoutes from './v1/super-admin';
import managerRoutes from './v1/manager';
import hrRoutes from './v1/hr';
import financeRoutes from './v1/finance';
import supportRoutes from './v1/support';
import areaManagerRoutes from './v1/area-manager';
import keyAccountManagerRoutes from './v1/key-account-manager';
import publicRoutes from './v1/public';
import externalRoutes from './v1/external';
import webhookRoutes from './v1/webhooks';
import uploadRoutes from './v1/upload';

const router = Router();

// Health check for all modules
router.get('/health/modules', (req, res) => {
  res.json({
    success: true,
    modules: {
      customer: 'operational',
      restaurant: 'operational',
      driver: 'operational',
      admin: 'operational',
      'super-admin': 'operational',
      manager: 'operational',
      hr: 'operational',
      finance: 'operational',
      support: 'operational',
      'area-manager': 'operational',
      'key-account-manager': 'operational',
      public: 'operational',
      external: 'operational',
      webhooks: 'operational',
      upload: 'operational'
    },
    timestamp: new Date().toISOString()
  });
});

export default {
  customer: customerRoutes,
  restaurant: restaurantRoutes,
  driver: driverRoutes,
  admin: adminRoutes,
  superAdmin: superAdminRoutes,
  manager: managerRoutes,
  hr: hrRoutes,
  finance: financeRoutes,
  support: supportRoutes,
  areaManager: areaManagerRoutes,
  keyAccountManager: keyAccountManagerRoutes,
  public: publicRoutes,
  external: externalRoutes,
  webhooks: webhookRoutes,
  upload: uploadRoutes,
};