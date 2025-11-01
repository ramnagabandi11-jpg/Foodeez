import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AdminUserAttributes {
  id: string;
  userId: string;
  role: 'manager' | 'support' | 'area_manager' | 'team_lead' | 'finance';
  department: string | null;
  permissions: string[];
  assignedCities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminUserCreationAttributes extends Optional<AdminUserAttributes, 'id' | 'department' | 'permissions' | 'assignedCities' | 'createdAt' | 'updatedAt'> {}

class AdminUser extends Model<AdminUserAttributes, AdminUserCreationAttributes> implements AdminUserAttributes {
  declare id: string;
  declare userId: string;
  declare role: 'manager' | 'support' | 'area_manager' | 'team_lead' | 'finance';
  declare department: string | null;
  declare permissions: string[];
  declare assignedCities: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AdminUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('manager', 'support', 'area_manager', 'team_lead', 'finance'),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    assignedCities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'admin_users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        fields: ['role'],
      },
    ],
  }
);

export default AdminUser;
