import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface LeaveRequestAttributes {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  leaveType: 'sick' | 'casual' | 'earned';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'status' | 'approvedBy' | 'rejectionReason' | 'createdAt' | 'updatedAt'> {}

class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
  declare id: string;
  declare employeeId: string;
  declare startDate: Date;
  declare endDate: Date;
  declare leaveType: 'sick' | 'casual' | 'earned';
  declare reason: string;
  declare status: 'pending' | 'approved' | 'rejected';
  declare approvedBy: string | null;
  declare rejectionReason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LeaveRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    leaveType: {
      type: DataTypes.ENUM('sick', 'casual', 'earned'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leave_requests',
    timestamps: true,
    indexes: [
      {
        fields: ['employeeId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['startDate'],
      },
    ],
  }
);

export default LeaveRequest;
