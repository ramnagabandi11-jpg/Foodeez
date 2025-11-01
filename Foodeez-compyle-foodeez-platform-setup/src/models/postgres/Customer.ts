import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface CustomerAttributes {
  id: string;
  userId: string;
  dateOfBirth: Date | null;
  loyaltyPoints: number;
  totalOrders: number;
  favoriteRestaurants: string[];
  dietaryPreferences: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'dateOfBirth' | 'loyaltyPoints' | 'totalOrders' | 'favoriteRestaurants' | 'dietaryPreferences' | 'createdAt' | 'updatedAt'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  declare id: string;
  declare userId: string;
  declare dateOfBirth: Date | null;
  declare loyaltyPoints: number;
  declare totalOrders: number;
  declare favoriteRestaurants: string[];
  declare dietaryPreferences: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Customer.init(
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
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    loyaltyPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    favoriteRestaurants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: false,
    },
    dietaryPreferences: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        fields: ['loyaltyPoints'],
      },
    ],
  }
);

export default Customer;
