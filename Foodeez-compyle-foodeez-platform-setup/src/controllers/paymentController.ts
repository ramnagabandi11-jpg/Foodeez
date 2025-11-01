import { Request, Response, NextFunction } from 'express';
import * as paymentService from '@/services/paymentService';
import { IApiResponse } from '@/types';
import { HTTP_STATUS } from '@/utils/constants';

/**
 * POST /payment/initiate
 * Initiate payment for order
 */
export const initiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, paymentMethod } = req.body;

    let paymentData;

    if (paymentMethod === 'razorpay' || paymentMethod === 'paytm') {
      paymentData = await paymentService.initiateRazorpayPayment(orderId);
    } else if (paymentMethod === 'wallet') {
      const userId = req.user!.userId;
      paymentData = await paymentService.processWalletPayment(orderId, userId);
    }

    const response: IApiResponse = {
      success: true,
      data: paymentData,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payment/razorpay/verify
 * Verify Razorpay payment
 */
export const verifyRazorpayPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const result = await paymentService.verifyRazorpayPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const response: IApiResponse = {
      success: true,
      data: result,
      message: 'Payment verified successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payment/wallet/add-money
 * Add money to wallet
 */
export const addMoneyToWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { amount } = req.body;

    const paymentData = await paymentService.addMoneyToWallet(userId, amount);

    const response: IApiResponse = {
      success: true,
      data: paymentData,
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payment/wallet/verify
 * Verify wallet credit payment
 */
export const verifyWalletCredit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const result = await paymentService.verifyWalletCredit({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const response: IApiResponse = {
      success: true,
      data: result,
      message: 'Wallet credited successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payment/refund/:orderId
 * Process refund
 */
export const processRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const result = await paymentService.processRefund(orderId, reason);

    const response: IApiResponse = {
      success: true,
      data: result,
      message: 'Refund processed successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  initiatePayment,
  verifyRazorpayPayment,
  addMoneyToWallet,
  verifyWalletCredit,
  processRefund,
};
