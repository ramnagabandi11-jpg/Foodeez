import { Router } from 'express';
import {
  createTicket,
  getUserTickets,
  getTicketDetails,
  addReply,
  updateTicketStatus,
  escalateTicket,
} from '@/controllers/supportController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All support routes require authentication
router.use(authenticate);

// Create ticket - available to all authenticated users
router.post(
  '/tickets',
  [
    body('orderId').optional().isUUID(),
    body('category').isIn(['order_issue', 'payment_issue', 'app_bug', 'account_issue', 'other']),
    body('subject').isString().trim().isLength({ min: 5, max: 200 }),
    body('description').isString().trim().isLength({ min: 10, max: 2000 }),
    body('attachments').optional().isArray(),
    validate,
  ],
  createTicket
);

// Get user's tickets - available to all authenticated users
router.get('/tickets', getUserTickets);

// Get ticket details - available to ticket owner and support/admin
router.get(
  '/tickets/:id',
  [
    param('id').isUUID(),
    validate,
  ],
  getTicketDetails
);

// Add reply - available to ticket owner and support/admin
router.post(
  '/tickets/:id/reply',
  [
    param('id').isUUID(),
    body('message').isString().trim().isLength({ min: 1, max: 2000 }),
    body('attachments').optional().isArray(),
    validate,
  ],
  addReply
);

// Update ticket status - support/admin only
router.put(
  '/tickets/:id/status',
  authorize(['support', 'admin', 'super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed']),
    body('resolution').optional().isString().trim().isLength({ max: 1000 }),
    validate,
  ],
  updateTicketStatus
);

// Escalate ticket - support/team_lead only
router.post(
  '/tickets/:id/escalate',
  authorize(['support', 'team_lead', 'manager', 'super_admin']),
  [
    param('id').isUUID(),
    body('escalationReason').isString().trim().isLength({ min: 10, max: 500 }),
    validate,
  ],
  escalateTicket
);

export default router;
