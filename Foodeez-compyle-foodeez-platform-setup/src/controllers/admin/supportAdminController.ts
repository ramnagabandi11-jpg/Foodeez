import { Request, Response, NextFunction } from 'express';
import { SupportTicket, User, Customer, Restaurant, DeliveryPartner } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// GET /v1/admin/support/tickets - List all support tickets
export const listSupportTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, category, assignedToMe, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    if (assignedToMe === 'true') {
      where.assignedTo = req.user?.id;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/support/tickets/:id - Get ticket details
export const getTicketDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
        {
          model: User,
          as: 'assignedToUser',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/support/tickets/:id/assign - Assign ticket to admin
export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminUserId } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    // Verify admin user exists
    const adminUser = await User.findByPk(adminUserId);
    if (!adminUser || !['super_admin', 'manager', 'support'].includes(adminUser.role)) {
      throw new AppError('Invalid admin user', 400);
    }

    ticket.assignedTo = adminUserId;
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /v1/admin/support/tickets/:id/priority - Update ticket priority
export const updateTicketPriority = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { priority, reason } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    const previousPriority = ticket.priority;
    ticket.priority = priority;

    // Add conversation entry about priority change
    const conversation = ticket.conversation || [];
    conversation.push({
      message: `Priority changed from ${previousPriority} to ${priority}. Reason: ${reason}`,
      sentBy: req.user?.id,
      sentAt: new Date(),
      isSystemMessage: true,
    });
    ticket.conversation = conversation;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket priority updated successfully',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/support/stats - Support statistics
export const getSupportStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.gte]: new Date(startDate as string),
          [Op.lte]: new Date(endDate as string),
        },
      };
    }

    // Total tickets
    const totalTickets = await SupportTicket.count({ where: dateFilter });

    // Tickets by status
    const openTickets = await SupportTicket.count({ where: { ...dateFilter, status: 'open' } });
    const inProgressTickets = await SupportTicket.count({ where: { ...dateFilter, status: 'in_progress' } });
    const resolvedTickets = await SupportTicket.count({ where: { ...dateFilter, status: 'resolved' } });
    const closedTickets = await SupportTicket.count({ where: { ...dateFilter, status: 'closed' } });

    // Tickets by priority
    const lowPriorityTickets = await SupportTicket.count({ where: { ...dateFilter, priority: 'low' } });
    const mediumPriorityTickets = await SupportTicket.count({ where: { ...dateFilter, priority: 'medium' } });
    const highPriorityTickets = await SupportTicket.count({ where: { ...dateFilter, priority: 'high' } });
    const urgentPriorityTickets = await SupportTicket.count({ where: { ...dateFilter, priority: 'urgent' } });

    // Tickets by category
    const tickets = await SupportTicket.findAll({
      where: dateFilter,
      attributes: ['category'],
    });

    const categoryBreakdown: any = {};
    tickets.forEach((ticket) => {
      const category = ticket.category;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Average resolution time (for resolved tickets)
    const resolvedTicketsWithTime = await SupportTicket.findAll({
      where: { ...dateFilter, status: 'resolved' },
      attributes: ['createdAt', 'updatedAt'],
    });

    let avgResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalResolutionTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const resolutionTime = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
        return sum + resolutionTime;
      }, 0);
      avgResolutionTime = totalResolutionTime / resolvedTicketsWithTime.length / (1000 * 60 * 60); // Convert to hours
    }

    // Tickets by user role
    const ticketsWithUsers = await SupportTicket.findAll({
      where: dateFilter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['role'],
        },
      ],
    });

    const roleBreakdown: any = {};
    ticketsWithUsers.forEach((ticket) => {
      const role = ticket.get('user')?.role || 'unknown';
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        total: totalTickets,
        byStatus: {
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
        },
        byPriority: {
          low: lowPriorityTickets,
          medium: mediumPriorityTickets,
          high: highPriorityTickets,
          urgent: urgentPriorityTickets,
        },
        byCategory: categoryBreakdown,
        byUserRole: roleBreakdown,
        avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
};
