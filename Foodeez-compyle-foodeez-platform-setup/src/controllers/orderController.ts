import { Request, Response, NextFunction } from 'express';
import * as orderService from '@/services/orderService';
import { IApiResponse } from '@/types';
import { HTTP_STATUS } from '@/utils/constants';

/**
 * POST /orders
 * Create new order
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.userId; // From auth middleware
    const orderData = { ...req.body, customerId };

    const order = await orderService.createOrder(orderData);

    const response: IApiResponse = {
      success: true,
      data: { order },
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:id
 * Get order details
 */
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await orderService.getOrderById(id);

    const response: IApiResponse = {
      success: true,
      data: { order },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders
 * Get customer orders
 */
export const getCustomerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.userId;
    const { status, limit, offset } = req.query;

    const { orders, total } = await orderService.getCustomerOrders(customerId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const response: IApiResponse = {
      success: true,
      data: { orders, total },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /orders/:id/status
 * Update order status
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body;

    const order = await orderService.updateOrderStatus(id, status, metadata);

    const response: IApiResponse = {
      success: true,
      data: { order },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /orders/:id/cancel
 * Cancel order
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await orderService.updateOrderStatus(id, 'cancelled_by_customer', {
      reason,
    });

    const response: IApiResponse = {
      success: true,
      data: { order },
      message: 'Order cancelled successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  getOrder,
  getCustomerOrders,
  updateOrderStatus,
  cancelOrder,
};
