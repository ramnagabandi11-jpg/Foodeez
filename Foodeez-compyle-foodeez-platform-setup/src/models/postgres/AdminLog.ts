import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AdminLogAttributes {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  createdAt?: Date;
}

export interface AdminLogCreationAttributes extends Optional<AdminLogAttributes, 'id' | 'oldValues' | 'newValues' | 'ipAddress' | 'createdAt'> {}

class AdminLog extends Model<AdminLogAttributes, AdminLogCreationAttributes> implements AdminLogAttributes {
  declare id: string;
  declare adminId: string;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string;
  declare oldValues: Record<string, any> | null;
  declare newValues: Record<string, any> | null;
  declare ipAddress: string | null;
  declare readonly createdAt: Date;
}

AdminLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'admin_logs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  }
);

export default AdminLog;