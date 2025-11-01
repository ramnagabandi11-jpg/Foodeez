import { Router } from 'express';
import {
  listDeliveryPartners,
  getDeliveryPartnerDetails,
  onboardDeliveryPartner,
  updateDeliveryPartner,
  verifyDeliveryPartner,
  updateDeliveryPartnerStatus,
  getPerformanceMetrics,
} from '@/controllers/admin/deliveryAdminController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All admin delivery partner routes require admin authentication
router.use(authenticate, authorize(['super_admin', 'manager', 'area_manager', 'team_lead']));

// List delivery partners
router.get('/', listDeliveryPartners);

// Get delivery partner details
router.get('/:id', [param('id').isUUID(), validate], getDeliveryPartnerDetails);

// Onboard delivery partner
router.post(
  '/',
  authorize(['super_admin', 'manager', 'area_manager']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 200 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone('en-IN'),
    body('password').isString().isLength({ min: 8 }),
    body('vehicleType').isIn(['bike', 'scooter', 'bicycle', 'car']),
    body('vehicleNumber').isString().trim().isLength({ min: 5, max: 20 }),
    body('aadharNumber').isString().matches(/^\d{12}$/),
    body('city').isString().trim().isLength({ min: 2, max: 100 }),
    body('documents').optional().isObject(),
    validate,
  ],
  onboardDeliveryPartner
);

// Update delivery partner
router.put(
  '/:id',
  authorize(['super_admin', 'manager', 'area_manager']),
  [param('id').isUUID(), validate],
  updateDeliveryPartner
);

// Verify delivery partner documents
router.patch(
  '/:id/verify',
  authorize(['super_admin', 'manager', 'area_manager']),
  [
    param('id').isUUID(),
    body('isVerified').isBoolean(),
    body('verificationNotes').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  verifyDeliveryPartner
);

// Update delivery partner status
router.patch(
  '/:id/status',
  authorize(['super_admin', 'manager']),
  [
    param('id').isUUID(),
    body('status').isIn(['active', 'suspended']),
    body('reason').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updateDeliveryPartnerStatus
);

// Get performance metrics
router.get('/:id/performance', [param('id').isUUID(), validate], getPerformanceMetrics);

export default router;
