import { Router } from 'express';
import { getActivityLogs } from '@/controllers/admin/activityLogsAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// Only super admins and managers can view activity logs
router.use(authenticate, authorize(['super_admin', 'manager']));

router.get(
  '/',
  [
    query('userId').optional().isUUID(),
    query('userRole').optional().isIn([
      'super_admin', 'manager', 'support', 'area_manager', 'team_lead', 'finance', 'hr',
      'customer', 'restaurant', 'delivery_partner'
    ]),
    query('action').optional().isString().trim().isLength({ max: 100 }),
    query('entityType').optional().isString().trim().isLength({ max: 50 }),
    query('entityId').optional().isUUID(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getActivityLogs
);

export default router;