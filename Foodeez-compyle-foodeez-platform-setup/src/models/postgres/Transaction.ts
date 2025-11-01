import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface TransactionAttributes {
  id: string;
  transactionNumber: string;
  type: 'payment' | 'refund' | 'wallet_credit' | 'wallet_debit' | 'subscription' | 'settlement' | 'withdrawal';
  userId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  paymentGateway: 'razorpay' | 'paytm' | 'wallet' | 'cod' | 'internal' | null;
  gatewayTransactionId: string | null;
  gatewayResponse: Record<string, any> | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  failureReason: string | null;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'transactionNumber' | 'orderId' | 'currency' | 'paymentGateway' | 'gatewayTransactionId' | 'gatewayResponse' | 'failureReason' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  declare id: string;
  declare transactionNumber: string;
  declare type: 'payment' | 'refund' | 'wallet_credit' | 'wallet_debit' | 'subscription' | 'settlement' | 'withdrawal';
  declare userId: string;
  declare orderId: string | null;
  declare amount: number;
  declare currency: string;
  declare paymentGateway: 'razorpay' | 'paytm' | 'wallet' | 'cod' | 'internal' | null;
  declare gatewayTransactionId: string | null;
  declare gatewayResponse: Record<string, any> | null;
  declare status: 'pending' | 'completed' | 'failed' | 'cancelled';
  declare failureReason: string | null;
  declare metadata: Record<string, any>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionNumber: {
      type: DataTypes.STRING(30),
      unique: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('payment', 'refund', 'wallet_credit', 'wallet_debit', 'subscription', 'settlement', 'withdrawal'),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
      allowNull: false,
    },
    paymentGateway: {
      type: DataTypes.ENUM('razorpay', 'paytm', 'wallet', 'cod', 'internal'),
      allowNull: true,
    },
    gatewayTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['transactionNumber'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['orderId'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Transaction;
