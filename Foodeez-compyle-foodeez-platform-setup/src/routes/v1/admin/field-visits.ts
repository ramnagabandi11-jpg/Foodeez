import { Router } from 'express';
import {
  listFieldVisits,
  scheduleFieldVisit,
  completeFieldVisit,
  getFieldVisitAnalytics,
} from '@/controllers/admin/fieldVisitsAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'area_manager', 'support']));

// List field visits
router.get(
  '/',
  [
    query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']),
    query('visitType').optional().isIn([
      'restaurant_audit',
      'delivery_partner_check',
      'kitchen_inspection',
      'customer_feedback',
    ]),
    query('assignedToMe').optional().isBoolean(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listFieldVisits
);

// Schedule new field visit
router.post(
  '/',
  authorize(['super_admin', 'manager', 'area_manager']),
  [
    body('restaurantId').optional().isUUID(),
    body('deliveryPartnerId').optional().isUUID(),
    body('visitType').isIn([
      'restaurant_audit',
      'delivery_partner_check',
      'kitchen_inspection',
      'customer_feedback',
    ]),
    body('scheduledDate').isISO8601(),
    body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('assignedTo').isUUID(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('purpose').isString().trim().isLength({ min: 10, max: 1000 }),
    body('location').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  scheduleFieldVisit
);

// Mark field visit as complete
router.patch(
  '/:id/complete',
  authorize(['super_admin', 'manager', 'area_manager']),
  [
    param('id').isString().trim().matches(/^field-visit-/),
    body('actualStartTime').optional().isISO8601(),
    body('actualEndTime').optional().isISO8601(),
    body('findings').optional().isString().trim().isLength({ max: 5000 }),
    body('photos').optional().isArray(),
    body('photos.*').optional().isURL(),
    body('recommendations').optional().isString().trim().isLength({ max: 2000 }),
    body('followUpRequired').optional().isBoolean(),
    body('followUpDate').optional().isISO8601(),
    validate,
  ],
  completeFieldVisit
);

// Field visit analytics
router.get(
  '/analytics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getFieldVisitAnalytics
);

export default router;
