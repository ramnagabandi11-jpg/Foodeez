import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AttendanceAttributes {
  id: string;
  employeeId: string;
  date: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: 'present' | 'absent' | 'half_day';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'checkInTime' | 'checkOutTime' | 'createdAt' | 'updatedAt'> {}

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  declare id: string;
  declare employeeId: string;
  declare date: Date;
  declare checkInTime: Date | null;
  declare checkOutTime: Date | null;
  declare status: 'present' | 'absent' | 'half_day';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Attendance.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'half_day'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'attendance',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId', 'date'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Attendance;
