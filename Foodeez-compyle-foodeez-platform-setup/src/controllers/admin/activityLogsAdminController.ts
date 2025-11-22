import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// Since we don't have ActivityLog model in the database schema, I'll create simple in-memory storage
// In a real production system, this would be a proper database model with Sequelize

interface ActivityLog {
  id: string;
  userId: string;
  userRole: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityDetails?: any;
  metadata?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// In-memory storage (in production, this would be a database table)
let activityLogs: ActivityLog[] = [];
let logIdCounter = 1;

// Helper functions
function generateLogId(): string {
  return `log-${String(logIdCounter++).padStart(8, '0')}`;
}

// Log an activity (this would be called by other controllers/middleware)
export function logActivity(
  userId: string,
  userRole: string,
  userName: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityDetails?: any,
  metadata?: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  ipAddress?: string,
  userAgent?: string
) {
  const log: ActivityLog = {
    id: generateLogId(),
    userId,
    userRole,
    userName,
    action,
    entityType,
    entityId,
    entityDetails,
    metadata,
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    timestamp: new Date(),
    severity,
  };

  activityLogs.push(log);

  // Keep only last 10000 logs to prevent memory issues (in production, this would be handled by database)
  if (activityLogs.length > 10000) {
    activityLogs = activityLogs.slice(-10000);
  }

  return log;
}

// GET /v1/admin/activity-logs - View all system activity logs
export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      userRole,
      action,
      entityType,
      entityId,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    let filteredLogs = activityLogs;

    // Apply filters
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (userRole) {
      filteredLogs = filteredLogs.filter(log => log.userRole === userRole);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log =>
        log.action.toLowerCase().includes((action as string).toLowerCase())
      );
    }

    if (entityType) {
      filteredLogs = filteredLogs.filter(log => log.entityType === entityType);
    }

    if (entityId) {
      filteredLogs = filteredLogs.filter(log => log.entityId === entityId);
    }

    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredLogs = filteredLogs.filter(log =>
        log.timestamp >= start && log.timestamp <= end
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedLogs = filteredLogs.slice(offset, offset + Number(limit));

    // Calculate summary statistics
    const totalLogs = filteredLogs.length;
    const criticalLogs = filteredLogs.filter(log => log.severity === 'critical').length;
    const highLogs = filteredLogs.filter(log => log.severity === 'high').length;
    const mediumLogs = filteredLogs.filter(log => log.severity === 'medium').length;
    const lowLogs = filteredLogs.filter(log => log.severity === 'low').length;

    // User activity breakdown
    const userActivity: any = {};
    filteredLogs.forEach(log => {
      const key = `${log.userName} (${log.userRole})`;
      if (!userActivity[key]) {
        userActivity[key] = { count: 0, lastActivity: null };
      }
      userActivity[key].count++;
      if (!userActivity[key].lastActivity || log.timestamp > new Date(userActivity[key].lastActivity)) {
        userActivity[key].lastActivity = log.timestamp;
      }
    });

    // Entity type breakdown
    const entityBreakdown: any = {};
    filteredLogs.forEach(log => {
      entityBreakdown[log.entityType] = (entityBreakdown[log.entityType] || 0) + 1;
    });

    // Top actions
    const actionCounts: any = {};
    filteredLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    res.status(200).json({
      success: true,
      data: {
        logs: paginatedLogs,
        summary: {
          total: totalLogs,
          bySeverity: {
            critical: criticalLogs,
            high: highLogs,
            medium: mediumLogs,
            low: lowLogs,
          },
          byEntityType: entityBreakdown,
          topActions,
          topUsers: Object.entries(userActivity)
            .sort(([, a], [, b]) => (b as any).count - (a as any).count)
            .slice(0, 10)
            .map(([user, activity]) => ({ user, ...(activity as any) })),
        },
        pagination: {
          total: totalLogs,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalLogs / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to automatically log activities for admin actions
export function activityLogger(action: string, entityType: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  return (req: Request, res: Response, next: NextFunction) => {
    // Don't log GET requests (read operations)
    if (req.method === 'GET') {
      return next();
    }

    const user = req.user;
    if (!user) {
      return next();
    }

    // Extract entity ID from request parameters if available
    const entityId = req.params.id || req.body.id || req.body.userId || req.body.restaurantId || req.body.orderId;

    // Log the activity
    logActivity(
      user.id,
      user.role || 'unknown',
      user.name || 'Unknown User',
      action,
      entityType,
      entityId,
      { body: req.body, params: req.params },
      { method: req.method, path: req.path },
      severity,
      req.ip,
      req.get('User-Agent')
    );

    next();
  };
}
