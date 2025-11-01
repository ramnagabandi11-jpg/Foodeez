import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface RestaurantSubscriptionAttributes {
  id: string;
  restaurantId: string;
  billingDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'waived';
  paymentMethod: 'razorpay' | 'paytm' | 'wallet' | 'cod' | null;
  transactionId: string | null;
  retryCount: number;
  lastRetryAt: Date | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestaurantSubscriptionCreationAttributes extends Optional<RestaurantSubscriptionAttributes, 'id' | 'paymentMethod' | 'transactionId' | 'retryCount' | 'lastRetryAt' | 'notes' | 'createdAt' | 'updatedAt'> {}

class RestaurantSubscription extends Model<RestaurantSubscriptionAttributes, RestaurantSubscriptionCreationAttributes> implements RestaurantSubscriptionAttributes {
  declare id: string;
  declare restaurantId: string;
  declare billingDate: string;
  declare amount: number;
  declare status: 'pending' | 'paid' | 'failed' | 'waived';
  declare paymentMethod: 'razorpay' | 'paytm' | 'wallet' | 'cod' | null;
  declare transactionId: string | null;
  declare retryCount: number;
  declare lastRetryAt: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RestaurantSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
    },
    billingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'waived'),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('razorpay', 'paytm', 'wallet', 'cod'),
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastRetryAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'restaurant_subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['restaurantId', 'billingDate'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['billingDate'],
      },
    ],
  }
);

export default RestaurantSubscription;
