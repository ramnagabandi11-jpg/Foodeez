import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface EmployeeAttributes {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  joiningDate: Date;
  exitDate: Date | null;
  salary: number;
  bankDetails: object | null;
  documents: object | null;
  shiftId: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'userId' | 'exitDate' | 'bankDetails' | 'documents' | 'shiftId' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  declare id: string;
  declare userId: string | null;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare departmentId: string;
  declare designation: string;
  declare joiningDate: Date;
  declare exitDate: Date | null;
  declare salary: number;
  declare bankDetails: object | null;
  declare documents: object | null;
  declare shiftId: string | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    exitDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    bankDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    shiftId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'shifts',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'employees',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['userId'],
        where: {
          userId: {
            [DataTypes.Op.ne]: null,
          },
        },
      },
      {
        fields: ['departmentId'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export default Employee;
