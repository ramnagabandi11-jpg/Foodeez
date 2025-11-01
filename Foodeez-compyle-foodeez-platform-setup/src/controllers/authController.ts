import { Request, Response, NextFunction } from 'express';
import * as authService from '@/services/authService';
import { IApiResponse } from '@/types';
import { HTTP_STATUS } from '@/utils/constants';

/**
 * POST /auth/register
 * Register new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, email, password, role } = req.body;

    const { user, tokens } = await authService.register({
      name,
      phone,
      email,
      password,
      role,
    });

    const response: IApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        tokens,
      },
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/send-otp
 * Request OTP for registration/login
 */
export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneOrEmail, purpose } = req.body;

    await authService.requestOTP(phoneOrEmail, purpose);

    const response: IApiResponse = {
      success: true,
      message: 'OTP sent successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify-otp
 * Verify OTP
 */
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneOrEmail, otp, purpose } = req.body;

    const isValid = await authService.verifyOTP(phoneOrEmail, otp, purpose);

    const response: IApiResponse = {
      success: true,
      data: { verified: isValid },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Login with phone/email and password
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneOrEmail, password } = req.body;

    const { user, tokens } = await authService.login(phoneOrEmail, password);

    const response: IApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        tokens,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh-token
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshAccessToken(refreshToken);

    const response: IApiResponse = {
      success: true,
      data: { tokens },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout user
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Implement token blacklisting in Redis
    // For now, just return success (client should delete token)

    const response: IApiResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  sendOTP,
  verifyOTP,
  login,
  refreshToken,
  logout,
};
