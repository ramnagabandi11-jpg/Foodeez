import { Router } from 'express';
import { body, param } from 'express-validator';
import * as paymentController from '@/controllers/paymentController';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { paymentRateLimiter } from '@/middleware/rateLimit';

const router = Router();

/**
 * POST /v1/payment/initiate
 * Initiate payment
 */
router.post(
  '/initiate',
  authenticate,
  paymentRateLimiter,
  [
    body('orderId').isUUID().withMessage('Invalid order ID'),
    body('paymentMethod')
      .isIn(['razorpay', 'paytm', 'wallet', 'cod'])
      .withMessage('Invalid payment method'),
    validate,
  ],
  paymentController.initiatePayment
);

/**
 * POST /v1/payment/razorpay/verify
 * Verify Razorpay payment
 */
router.post(
  '/razorpay/verify',
  authenticate,
  [
    body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
    validate,
  ],
  paymentController.verifyRazorpayPayment
);

/**
 * POST /v1/payment/wallet/add-money
 * Add money to wallet
 */
router.post(
  '/wallet/add-money',
  authenticate,
  paymentRateLimiter,
  [
    body('amount')
      .isFloat({ min: 100, max: 50000 })
      .withMessage('Amount must be between ₹100 and ₹50,000'),
    validate,
  ],
  paymentController.addMoneyToWallet
);

/**
 * POST /v1/payment/wallet/verify
 * Verify wallet credit payment
 */
router.post(
  '/wallet/verify',
  authenticate,
  [
    body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
    validate,
  ],
  paymentController.verifyWalletCredit
);

/**
 * POST /v1/payment/refund/:orderId
 * Process refund
 */
router.post(
  '/refund/:orderId',
  authenticate,
  authorize('admin', 'super_admin'),
  [
    param('orderId').isUUID().withMessage('Invalid order ID'),
    body('reason').notEmpty().withMessage('Refund reason is required'),
    validate,
  ],
  paymentController.processRefund
);

export default router;
