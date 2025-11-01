import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, Customer, Restaurant, DeliveryPartner, Wallet, OTPVerification } from '@/models/postgres';
import {
  UnauthorizedError,
  ValidationError,
  ConflictError,
  InvalidOTPError,
  NotFoundError,
} from '@/utils/errors';
import { IAuthPayload, ITokenPair, UserRole } from '@/types';
import { OTP_CONFIG } from '@/utils/constants';

/**
 * Generate OTP (6 digits)
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (payload: IAuthPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '24h',
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (payload: IAuthPayload): string => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET not configured');
  }

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  });
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (user: {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
}): ITokenPair => {
  const payload: IAuthPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Send OTP via SMS/Email (placeholder - integrate with actual SMS/Email service)
 */
const sendOTP = async (phoneOrEmail: string, otp: string): Promise<void> => {
  // TODO: Integrate with Twilio/MSG91 for SMS
  // TODO: Integrate with AWS SES for Email
  console.log(`Sending OTP ${otp} to ${phoneOrEmail}`);
  // For now, just log it (in production, send via SMS/Email service)
};

/**
 * Request OTP for registration or login
 */
export const requestOTP = async (
  phoneOrEmail: string,
  purpose: 'registration' | 'login' | 'password_reset'
): Promise<void> => {
  // Check if user exists
  const existingUser = await User.findOne({
    where: {
      [phoneOrEmail.includes('@') ? 'email' : 'phone']: phoneOrEmail,
    },
  });

  if (purpose === 'registration' && existingUser) {
    throw new ConflictError('User already exists');
  }

  if (purpose === 'login' && !existingUser) {
    throw new NotFoundError('User not found');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.VALIDITY_MINUTES);

  // Store OTP in database (hashed)
  await OTPVerification.create({
    phoneOrEmail,
    otp, // Will be hashed by beforeCreate hook
    purpose,
    expiresAt,
  });

  // Send OTP
  await sendOTP(phoneOrEmail, otp);
};

/**
 * Verify OTP
 */
export const verifyOTP = async (
  phoneOrEmail: string,
  otp: string,
  purpose: 'registration' | 'login' | 'password_reset'
): Promise<boolean> => {
  // Find latest OTP for this phone/email and purpose
  const otpRecord = await OTPVerification.findOne({
    where: {
      phoneOrEmail,
      purpose,
      isVerified: false,
    },
    order: [['createdAt', 'DESC']],
  });

  if (!otpRecord) {
    throw new InvalidOTPError('OTP not found or already verified');
  }

  // Check expiration
  if (new Date() > otpRecord.expiresAt) {
    throw new InvalidOTPError('OTP expired');
  }

  // Check attempts
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    throw new InvalidOTPError('Too many failed attempts');
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otp, otpRecord.otp);

  if (!isValid) {
    // Increment attempts
    await otpRecord.update({ attempts: otpRecord.attempts + 1 });
    throw new InvalidOTPError('Invalid OTP');
  }

  // Mark as verified
  await otpRecord.update({
    isVerified: true,
    verifiedAt: new Date(),
  });

  return true;
};

/**
 * Register new user
 */
export const register = async (data: {
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  role: UserRole;
}): Promise<{ user: User; tokens: ITokenPair }> => {
  const { name, phone, email, password, role } = data;

  // Validate
  if (!phone && !email) {
    throw new ValidationError('Phone or email is required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: phone ? { phone } : { email },
  });

  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    phone: phone || null,
    email: email || null,
    passwordHash: password || null,
    role,
    status: role === 'customer' ? 'active' : 'pending_approval',
    phoneVerified: !!phone,
    emailVerified: !!email,
  });

  // Create role-specific record and wallet
  if (role === 'customer') {
    await Customer.create({ userId: user.id });
    await Wallet.create({ userId: user.id, customerId: (await Customer.findOne({ where: { userId: user.id } }))!.id });
  } else if (role === 'restaurant') {
    // Restaurant will be created separately with full details
  } else if (role === 'delivery_partner') {
    // DeliveryPartner will be created separately with full details
  }

  // Generate tokens
  const tokens = generateTokenPair(user);

  return { user, tokens };
};

/**
 * Login with phone/email and password
 */
export const login = async (
  phoneOrEmail: string,
  password?: string
): Promise<{ user: User; tokens: ITokenPair }> => {
  // Find user
  const user = await User.findOne({
    where: phoneOrEmail.includes('@') ? { email: phoneOrEmail } : { phone: phoneOrEmail },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check password if provided
  if (password) {
    if (!user.passwordHash) {
      throw new UnauthorizedError('Password not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
  }

  // Update last login
  await user.update({ lastLoginAt: new Date() });

  // Generate tokens
  const tokens = generateTokenPair(user);

  return { user, tokens };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<ITokenPair> => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as IAuthPayload;

    // Verify user still exists
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens
    return generateTokenPair(user);
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export default {
  generateTokenPair,
  requestOTP,
  verifyOTP,
  register,
  login,
  refreshAccessToken,
};
