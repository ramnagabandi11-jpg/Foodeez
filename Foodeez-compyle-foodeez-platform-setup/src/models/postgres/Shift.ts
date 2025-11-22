import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface ShiftAttributes {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'days' | 'createdAt' | 'updatedAt'> {}

class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
  declare id: string;
  declare name: string;
  declare startTime: string;
  declare endTime: string;
  declare days: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Shift.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    days: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'shifts',
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
      },
    ],
  }
);

export default Shift;
