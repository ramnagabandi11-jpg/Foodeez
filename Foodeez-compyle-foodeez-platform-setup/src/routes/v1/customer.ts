import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getWallet,
  getWalletTransactions,
  getLoyalty,
  getLoyaltyTransactions,
} from '@/controllers/customerController';
import { authenticate, authorize } from '@/middleware/auth';
import { body, param } from 'express-validator';
import { validate } from '@/middleware/validation';

const router = Router();

// All customer routes require authentication with customer role
router.use(authenticate, authorize(['customer']));

// Profile routes
router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 200 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('en-IN'),
    validate,
  ],
  updateProfile
);

// Address routes
router.get('/addresses', getAddresses);

router.post(
  '/addresses',
  [
    body('label').isString().trim().isLength({ min: 1, max: 50 }),
    body('addressLine1').isString().trim().isLength({ min: 5, max: 255 }),
    body('addressLine2').optional().isString().trim().isLength({ max: 255 }),
    body('city').isString().trim().isLength({ min: 2, max: 100 }),
    body('state').isString().trim().isLength({ min: 2, max: 100 }),
    body('pincode').isString().matches(/^\d{6}$/),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('instructions').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  addAddress
);

router.put(
  '/addresses/:id',
  [
    param('id').isUUID(),
    body('label').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('addressLine1').optional().isString().trim().isLength({ min: 5, max: 255 }),
    body('addressLine2').optional().isString().trim().isLength({ max: 255 }),
    body('city').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('state').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('pincode').optional().isString().matches(/^\d{6}$/),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('instructions').optional().isString().trim().isLength({ max: 500 }),
    validate,
  ],
  updateAddress
);

router.delete(
  '/addresses/:id',
  [
    param('id').isUUID(),
    validate,
  ],
  deleteAddress
);

// Wallet routes
router.get('/wallet', getWallet);

router.get('/wallet/transactions', getWalletTransactions);

// Loyalty points routes
router.get('/loyalty', getLoyalty);

router.get('/loyalty/transactions', getLoyaltyTransactions);

export default router;
