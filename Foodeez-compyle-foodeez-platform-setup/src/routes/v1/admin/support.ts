import { Router } from 'express';
import {
  listSupportTickets,
  getTicketDetails,
  assignTicket,
  updateTicketPriority,
  getSupportStats,
} from '@/controllers/admin/supportAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param, query } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All routes require admin authentication with support role
router.use(authenticate, authorize(['super_admin', 'manager', 'support']));

// List all support tickets
router.get(
  '/tickets',
  [
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('category').optional().isIn([
      'order_issue',
      'payment_issue',
      'delivery_issue',
      'account_issue',
      'technical_issue',
      'feedback',
      'other',
    ]),
    query('assignedToMe').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  listSupportTickets
);

// Get ticket details
router.get('/tickets/:id', [param('id').isUUID(), validate], getTicketDetails);

// Assign ticket to admin
router.patch(
  '/tickets/:id/assign',
  [
    param('id').isUUID(),
    body('adminUserId').isUUID(),
    validate,
  ],
  assignTicket
);

// Update ticket priority
router.patch(
  '/tickets/:id/priority',
  authorize(['super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']),
    body('reason').isString().trim().isLength({ min: 5, max: 500 }),
    validate,
  ],
  updateTicketPriority
);

// Support statistics
router.get(
  '/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getSupportStats
);

export default router;
