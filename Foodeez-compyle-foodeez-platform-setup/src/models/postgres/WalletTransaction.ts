import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface WalletTransactionAttributes {
  id: string;
  walletId: string;
  transactionId: string | null;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata: Record<string, any>;
  createdAt?: Date;
}

export interface WalletTransactionCreationAttributes extends Optional<WalletTransactionAttributes, 'id' | 'transactionId' | 'metadata' | 'createdAt'> {}

class WalletTransaction extends Model<WalletTransactionAttributes, WalletTransactionCreationAttributes> implements WalletTransactionAttributes {
  declare id: string;
  declare walletId: string;
  declare transactionId: string | null;
  declare type: 'credit' | 'debit';
  declare amount: number;
  declare balanceBefore: number;
  declare balanceAfter: number;
  declare description: string;
  declare metadata: Record<string, any>;
  declare readonly createdAt: Date;
}

WalletTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'wallet_transactions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['walletId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default WalletTransaction;
