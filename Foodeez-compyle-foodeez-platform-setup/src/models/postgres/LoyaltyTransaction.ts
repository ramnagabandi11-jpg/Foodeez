import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface LoyaltyTransactionAttributes {
  id: string;
  customerId: string;
  orderId: string | null;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  expiresAt: Date | null;
  createdAt?: Date;
}

export interface LoyaltyTransactionCreationAttributes extends Optional<LoyaltyTransactionAttributes, 'id' | 'orderId' | 'expiresAt' | 'createdAt'> {}

class LoyaltyTransaction extends Model<LoyaltyTransactionAttributes, LoyaltyTransactionCreationAttributes> implements LoyaltyTransactionAttributes {
  declare id: string;
  declare customerId: string;
  declare orderId: string | null;
  declare type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  declare points: number;
  declare description: string;
  declare balanceBefore: number;
  declare balanceAfter: number;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
}

LoyaltyTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
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
    type: {
      type: DataTypes.ENUM('earned', 'redeemed', 'expired', 'bonus'),
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'loyalty_transactions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['customerId'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['expiresAt'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default LoyaltyTransaction;
