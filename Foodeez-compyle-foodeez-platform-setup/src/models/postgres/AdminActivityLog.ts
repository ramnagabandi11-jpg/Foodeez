import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AdminActivityLogAttributes {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt?: Date;
}

export interface AdminActivityLogCreationAttributes extends Optional<AdminActivityLogAttributes, 'id' | 'details' | 'ipAddress' | 'userAgent' | 'createdAt'> {}

class AdminActivityLog extends Model<AdminActivityLogAttributes, AdminActivityLogCreationAttributes> implements AdminActivityLogAttributes {
  declare id: string;
  declare adminUserId: string;
  declare action: string;
  declare targetType: string;
  declare targetId: string;
  declare details: Record<string, any>;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
}

AdminActivityLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    adminUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'admin_activity_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['adminUserId'],
      },
      {
        fields: ['targetType', 'targetId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default AdminActivityLog;
