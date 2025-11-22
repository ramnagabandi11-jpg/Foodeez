import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// Since we don't have a FieldVisit model in the database schema, I'll create a simple in-memory storage
// In a real production system, this would be a proper database model with a Sequelize model

interface FieldVisit {
  id: string;
  restaurantId?: string;
  deliveryPartnerId?: string;
  visitType: 'restaurant_audit' | 'delivery_partner_check' | 'kitchen_inspection' | 'customer_feedback';
  scheduledDate: Date;
  scheduledTime: string;
  assignedTo: string; // Admin user ID
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  purpose: string;
  location?: string;
  notes?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  findings?: string;
  photos?: string[];
  recommendations?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage (in production, this would be a database table)
let fieldVisits: FieldVisit[] = [];
let visitIdCounter = 1;

// Helper functions
function generateVisitId(): string {
  return `field-visit-${String(visitIdCounter++).padStart(4, '0')}`;
}

function getNextVisitNumber(): string {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  return `FV${today.getFullYear()}${String(dayOfYear).padStart(3, '0')}${String(visitIdCounter).padStart(3, '0')}`;
}

// GET /v1/admin/field-visits - List field visits
export const listFieldVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, visitType, assignedToMe, startDate, endDate, page = 1, limit = 20 } = req.query;

    let filteredVisits = fieldVisits;

    // Apply filters
    if (status) {
      filteredVisits = filteredVisits.filter(visit => visit.status === status);
    }

    if (visitType) {
      filteredVisits = filteredVisits.filter(visit => visit.visitType === visitType);
    }

    if (assignedToMe === 'true') {
      filteredVisits = filteredVisits.filter(visit => visit.assignedTo === req.user?.id);
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredVisits = filteredVisits.filter(visit =>
        visit.scheduledDate >= start && visit.scheduledDate <= end
      );
    }

    // Sort by scheduled date descending
    filteredVisits.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedVisits = filteredVisits.slice(offset, offset + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        visits: paginatedVisits,
        pagination: {
          total: filteredVisits.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filteredVisits.length / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/field-visits - Schedule new field visit
export const scheduleFieldVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      restaurantId,
      deliveryPartnerId,
      visitType,
      scheduledDate,
      scheduledTime,
      assignedTo,
      priority = 'medium',
      purpose,
      location,
    } = req.body;

    // Validate that either restaurantId or deliveryPartnerId is provided
    if (!restaurantId && !deliveryPartnerId) {
      throw new AppError('Either restaurant ID or delivery partner ID must be provided', 400);
    }

    // Validate visit type
    const validVisitTypes = ['restaurant_audit', 'delivery_partner_check', 'kitchen_inspection', 'customer_feedback'];
    if (!validVisitTypes.includes(visitType)) {
      throw new AppError('Invalid visit type', 400);
    }

    const newVisit: FieldVisit = {
      id: generateVisitId(),
      restaurantId,
      deliveryPartnerId,
      visitType,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      assignedTo,
      status: 'scheduled',
      priority,
      purpose,
      location,
      createdBy: req.user?.id || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    fieldVisits.push(newVisit);

    res.status(201).json({
      success: true,
      message: 'Field visit scheduled successfully',
      data: { visit: newVisit },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/field-visits/:id/complete - Mark field visit as complete
export const completeFieldVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      actualStartTime,
      actualEndTime,
      findings,
      photos,
      recommendations,
      followUpRequired,
      followUpDate,
    } = req.body;

    const visitIndex = fieldVisits.findIndex(visit => visit.id === id);
    if (visitIndex === -1) {
      throw new AppError('Field visit not found', 404);
    }

    const visit = fieldVisits[visitIndex];

    if (visit.status === 'completed') {
      throw new AppError('Field visit is already completed', 400);
    }

    if (visit.status === 'cancelled') {
      throw new AppError('Cannot complete a cancelled field visit', 400);
    }

    // Update visit details
    visit.status = 'completed';
    visit.actualStartTime = actualStartTime ? new Date(actualStartTime) : new Date();
    visit.actualEndTime = actualEndTime ? new Date(actualEndTime) : new Date();
    visit.findings = findings;
    visit.photos = photos || [];
    visit.recommendations = recommendations;
    visit.followUpRequired = followUpRequired || false;
    visit.followUpDate = followUpDate ? new Date(followUpDate) : undefined;
    visit.updatedAt = new Date();

    fieldVisits[visitIndex] = visit;

    res.status(200).json({
      success: true,
      message: 'Field visit completed successfully',
      data: { visit },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/field-visits/analytics - Field visit analytics
export const getFieldVisitAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let filteredVisits = fieldVisits;

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredVisits = filteredVisits.filter(visit =>
        visit.scheduledDate >= start && visit.scheduledDate <= end
      );
    }

    // Calculate statistics
    const totalVisits = filteredVisits.length;
    const completedVisits = filteredVisits.filter(visit => visit.status === 'completed').length;
    const scheduledVisits = filteredVisits.filter(visit => visit.status === 'scheduled').length;
    const inProgressVisits = filteredVisits.filter(visit => visit.status === 'in_progress').length;
    const cancelledVisits = filteredVisits.filter(visit => visit.status === 'cancelled').length;

    // Visit type breakdown
    const visitTypeBreakdown: any = {};
    filteredVisits.forEach(visit => {
      visitTypeBreakdown[visit.visitType] = (visitTypeBreakdown[visit.visitType] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: any = {};
    ['low', 'medium', 'high'].forEach(priority => {
      priorityBreakdown[priority] = filteredVisits.filter(visit => visit.priority === priority).length;
    });

    // Completion rate
    const completionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

    // Average visit duration (for completed visits)
    const completedVisitsWithDuration = filteredVisits.filter(
      visit => visit.status === 'completed' && visit.actualStartTime && visit.actualEndTime
    );

    let avgVisitDuration = 0;
    if (completedVisitsWithDuration.length > 0) {
      const totalDuration = completedVisitsWithDuration.reduce((sum, visit) => {
        if (visit.actualStartTime && visit.actualEndTime) {
          return sum + (visit.actualEndTime.getTime() - visit.actualStartTime.getTime());
        }
        return sum;
      }, 0);
      avgVisitDuration = totalDuration / completedVisitsWithDuration.length / (1000 * 60); // Convert to minutes
    }

    // Follow-up rate
    const visitsRequiringFollowUp = completedVisits.filter(visit => visit.followUpRequired).length;
    const followUpRate = completedVisits > 0 ? (visitsRequiringFollowUp / completedVisits) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        overview: {
          totalVisits,
          completedVisits,
          scheduledVisits,
          inProgressVisits,
          cancelledVisits,
          completionRate: Math.round(completionRate * 10) / 10,
        },
        breakdown: {
          visitTypes: visitTypeBreakdown,
          priorities: priorityBreakdown,
        },
        metrics: {
          avgVisitDurationMinutes: Math.round(avgVisitDuration * 10) / 10,
          followUpRate: Math.round(followUpRate * 10) / 10,
          visitsRequiringFollowUp,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
