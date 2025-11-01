import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface HolidayAttributes {
  id: string;
  name: string;
  date: Date;
  isOptional: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id' | 'isOptional' | 'createdAt' | 'updatedAt'> {}

class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
  declare id: string;
  declare name: string;
  declare date: Date;
  declare isOptional: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Holiday.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'holidays',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['date', 'name'],
      },
      {
        fields: ['date'],
      },
    ],
  }
);

export default Holiday;
