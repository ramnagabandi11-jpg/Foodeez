import { Request, Response, NextFunction } from 'express';
import { SupportTicket, User, Order, AdminUser } from '@/models/postgres';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// POST /v1/support/tickets - Create support ticket
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId, category, subject, description, attachments } = req.body;

    const ticket = await SupportTicket.create({
      userId,
      orderId: orderId || null,
      category,
      subject,
      description,
      attachments: attachments || [],
      status: 'open',
      priority: 'medium', // Default priority
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/support/tickets - Get user's support tickets
export const getUserTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt'],
          required: false,
        },
        {
          model: AdminUser,
          as: 'assignedAdmin',
          attributes: ['id', 'role'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name'],
            },
          ],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
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

// GET /v1/support/tickets/:id - Get ticket details
export const getTicketDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;

    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber', 'createdAt', 'status', 'totalAmount'],
          required: false,
        },
        {
          model: AdminUser,
          as: 'assignedAdmin',
          attributes: ['id', 'role'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
          required: false,
        },
      ],
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Authorization: User can see own tickets, support/admin can see all
    if (
      userRole !== 'admin' &&
      userRole !== 'support' &&
      userRole !== 'super_admin' &&
      userRole !== 'manager' &&
      ticket.userId !== userId
    ) {
      throw new AppError('Unauthorized to view this ticket', 403);
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/support/tickets/:id/reply - Add reply to ticket
export const addReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { message, attachments } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Add reply to conversation
    const reply = {
      userId,
      userName: user.name,
      userRole: user.role,
      message,
      attachments: attachments || [],
      timestamp: new Date(),
    };

    const currentConversation = ticket.conversation || [];
    ticket.conversation = [...currentConversation, reply];

    // If user is replying to their own ticket, keep status as is
    // If admin is replying, update status to in_progress if it was open
    if (user.role === 'admin' || user.role === 'support' || user.role === 'super_admin') {
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    }

    await ticket.save();

    // TODO: Send notification to the other party

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/support/tickets/:id/status - Update ticket status (Admin only)
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    ticket.status = status;
    if (resolution) {
      ticket.resolution = resolution;
    }

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // TODO: Send notification to ticket creator

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/support/tickets/:id/escalate - Escalate ticket
export const escalateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { escalationReason } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Change priority to high
    ticket.priority = 'high';
    ticket.escalationReason = escalationReason;
    ticket.escalatedAt = new Date();

    await ticket.save();

    // TODO: Notify senior support/team lead

    res.status(200).json({
      success: true,
      message: 'Ticket escalated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
