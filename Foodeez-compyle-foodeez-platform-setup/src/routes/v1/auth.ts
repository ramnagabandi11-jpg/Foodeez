import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '@/controllers/authController';
import { validate } from '@/middleware/validation';
import { loginRateLimiter, otpRateLimiter } from '@/middleware/rateLimit';

const router = Router();

/**
 * POST /v1/auth/register
 * Register new user
 */
router.post(
  '/register',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('role')
      .isIn(['customer', 'restaurant', 'delivery_partner'])
      .withMessage('Invalid role'),
    body('phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Invalid phone number'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    validate,
  ],
  authController.register
);

/**
 * POST /v1/auth/send-otp
 * Request OTP
 */
router.post(
  '/send-otp',
  otpRateLimiter,
  [
    body('phoneOrEmail').notEmpty().withMessage('Phone or email is required'),
    body('purpose')
      .isIn(['registration', 'login', 'password_reset'])
      .withMessage('Invalid purpose'),
    validate,
  ],
  authController.sendOTP
);

/**
 * POST /v1/auth/verify-otp
 * Verify OTP
 */
router.post(
  '/verify-otp',
  [
    body('phoneOrEmail').notEmpty().withMessage('Phone or email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('purpose')
      .isIn(['registration', 'login', 'password_reset'])
      .withMessage('Invalid purpose'),
    validate,
  ],
  authController.verifyOTP
);

/**
 * POST /v1/auth/login
 * Login
 */
router.post(
  '/login',
  loginRateLimiter,
  [
    body('phoneOrEmail').notEmpty().withMessage('Phone or email is required'),
    body('password').optional().notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

/**
 * POST /v1/auth/refresh-token
 * Refresh access token
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate,
  ],
  authController.refreshToken
);

/**
 * POST /v1/auth/logout
 * Logout
 */
router.post('/logout', authController.logout);

export default router;
