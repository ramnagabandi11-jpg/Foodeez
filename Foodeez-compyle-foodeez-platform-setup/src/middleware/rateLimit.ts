import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '@/utils/constants';
import { RateLimitError } from '@/utils/errors';

/**
 * Rate limiter for login attempts
 */
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.windowMs,
  max: RATE_LIMITS.LOGIN.max,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many login attempts'));
  },
});

/**
 * Rate limiter for OTP requests
 */
export const otpRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.OTP.windowMs,
  max: RATE_LIMITS.OTP.max,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many OTP requests'));
  },
});

/**
 * Rate limiter for payment attempts
 */
export const paymentRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.PAYMENT.windowMs,
  max: RATE_LIMITS.PAYMENT.max,
  message: 'Too many payment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many payment attempts'));
  },
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.windowMs,
  max: RATE_LIMITS.API.max,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many requests'));
  },
});

export default {
  loginRateLimiter,
  otpRateLimiter,
  paymentRateLimiter,
  apiRateLimiter,
};
