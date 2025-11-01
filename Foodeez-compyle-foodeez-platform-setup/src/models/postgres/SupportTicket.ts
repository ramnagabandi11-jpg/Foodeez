import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface SupportTicketAttributes {
  id: string;
  ticketNumber: string;
  userId: string;
  orderId: string | null;
  subject: string;
  description: string;
  category: 'order_issue' | 'payment_issue' | 'delivery_issue' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo: string | null;
  attachments: string[];
  internalNotes: string | null;
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportTicketCreationAttributes extends Optional<SupportTicketAttributes, 'id' | 'ticketNumber' | 'orderId' | 'priority' | 'status' | 'assignedTo' | 'attachments' | 'internalNotes' | 'resolution' | 'resolvedAt' | 'createdAt' | 'updatedAt'> {}

class SupportTicket extends Model<SupportTicketAttributes, SupportTicketCreationAttributes> implements SupportTicketAttributes {
  declare id: string;
  declare ticketNumber: string;
  declare userId: string;
  declare orderId: string | null;
  declare subject: string;
  declare description: string;
  declare category: 'order_issue' | 'payment_issue' | 'delivery_issue' | 'account' | 'other';
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  declare assignedTo: string | null;
  declare attachments: string[];
  declare internalNotes: string | null;
  declare resolution: string | null;
  declare resolvedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportTicket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('order_issue', 'payment_issue', 'delivery_issue', 'account', 'other'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed'),
      defaultValue: 'open',
      allowNull: false,
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'support_tickets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['ticketNumber'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['orderId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['assignedTo'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default SupportTicket;
