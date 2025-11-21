import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { StatusCode } from '@/utils/constants';
import {
  getAllUsers,
  updateUserStatus,
  getPendingRestaurants,
  approveOrRejectRestaurant,
  getAllOrders,
  getDashboardAnalytics,
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getRestaurantPerformanceAnalytics,
  getAdminLogs,
} from '@/services/adminService';
import { asyncHandler } from '@/middleware/asyncHandler';

/**
 * Middleware to check admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(StatusCode.FORBIDDEN).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

/**
 * Get all users
 */
export const getAllUsersController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    startDate,
    endDate,
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    role: role as string | undefined,
    isActive: isActive !== undefined ? isActive === 'true' : undefined,
    search: search as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await getAllUsers(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatusController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { userId } = req.params;
  const { isActive, deactivationReason } = req.body;
  const adminId = req.user?.userId;

  if (!adminId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Admin ID not found',
    });
  }

  const user = await updateUserStatus(userId, adminId, {
    isActive,
    deactivationReason,
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

/**
 * Get pending restaurant approvals
 */
export const getPendingRestaurantsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 20,
    search,
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string | undefined,
  };

  const result = await getPendingRestaurants(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Pending restaurants retrieved successfully',
    data: result,
  });
});

/**
 * Approve or reject a restaurant
 */
export const approveOrRejectRestaurantController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { restaurantId } = req.params;
  const { isApproved, rejectionReason } = req.body;
  const adminId = req.user?.userId;

  if (!adminId) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Admin ID not found',
    });
  }

  const restaurant = await approveOrRejectRestaurant(restaurantId, adminId, {
    isApproved,
    rejectionReason,
  });

  res.status(StatusCode.OK).json({
    success: true,
    message: `Restaurant ${isApproved ? 'approved' : 'rejected'} successfully`,
    data: restaurant,
  });
});

/**
 * Get all orders with filtering
 */
export const getAllOrdersController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 20,
    status,
    restaurantId,
    customerId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    status: status as string | undefined,
    restaurantId: restaurantId as string | undefined,
    customerId: customerId as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
  };

  const result = await getAllOrders(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

/**
 * Get dashboard analytics
 */
export const getDashboardAnalyticsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const analytics = await getDashboardAnalytics();

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Dashboard analytics retrieved successfully',
    data: analytics,
  });
});

/**
 * Get revenue analytics
 */
export const getRevenueAnalyticsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    startDate,
    endDate,
    period = 'daily',
  } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    period: period as 'daily' | 'weekly' | 'monthly',
  };

  const analytics = await getRevenueAnalytics(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Revenue analytics retrieved successfully',
    data: analytics,
  });
});

/**
 * Get user growth analytics
 */
export const getUserGrowthAnalyticsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    startDate,
    endDate,
    period = 'daily',
  } = req.query;

  const options = {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    period: period as 'daily' | 'weekly' | 'monthly',
  };

  const analytics = await getUserGrowthAnalytics(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'User growth analytics retrieved successfully',
    data: analytics,
  });
});

/**
 * Get restaurant performance analytics
 */
export const getRestaurantPerformanceAnalyticsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    limit = 10,
    sortBy = 'revenue',
  } = req.query;

  const options = {
    limit: parseInt(limit as string),
    sortBy: sortBy as 'revenue' | 'orders' | 'rating',
  };

  const analytics = await getRestaurantPerformanceAnalytics(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Restaurant performance analytics retrieved successfully',
    data: analytics,
  });
});

/**
 * Get admin logs
 */
export const getAdminLogsController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 20,
    adminId,
    action,
    resourceType,
    startDate,
    endDate,
  } = req.query;

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    adminId: adminId as string | undefined,
    action: action as string | undefined,
    resourceType: resourceType as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await getAdminLogs(options);

  res.status(StatusCode.OK).json({
    success: true,
    message: 'Admin logs retrieved successfully',
    data: result,
  });
});

export default {
  requireAdmin,
  getAllUsersController,
  updateUserStatusController,
  getPendingRestaurantsController,
  approveOrRejectRestaurantController,
  getAllOrdersController,
  getDashboardAnalyticsController,
  getRevenueAnalyticsController,
  getUserGrowthAnalyticsController,
  getRestaurantPerformanceAnalyticsController,
  getAdminLogsController,
};