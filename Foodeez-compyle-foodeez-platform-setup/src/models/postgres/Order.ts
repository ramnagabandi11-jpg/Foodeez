import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { OrderStatus, PaymentMethod } from '@/types';

export interface OrderAttributes {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  deliveryAddressId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
  paymentTransactionId: string | null;
  itemTotal: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  discount: number;
  promoCode: string | null;
  loyaltyPointsUsed: number;
  totalAmount: number;
  specialInstructions: string | null;
  estimatedPreparationTime: number | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  isPremiumDelivery: boolean;
  restaurantAcceptedAt: Date | null;
  driverAcceptedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'orderNumber' | 'deliveryPartnerId' | 'paymentTransactionId' | 'discount' | 'promoCode' | 'loyaltyPointsUsed' | 'specialInstructions' | 'estimatedPreparationTime' | 'estimatedDeliveryTime' | 'actualDeliveryTime' | 'isPremiumDelivery' | 'restaurantAcceptedAt' | 'driverAcceptedAt' | 'pickedUpAt' | 'deliveredAt' | 'cancelledAt' | 'cancellationReason' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: string;
  declare orderNumber: string;
  declare customerId: string;
  declare restaurantId: string;
  declare deliveryPartnerId: string | null;
  declare deliveryAddressId: string;
  declare status: OrderStatus;
  declare paymentMethod: PaymentMethod;
  declare paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
  declare paymentTransactionId: string | null;
  declare itemTotal: number;
  declare deliveryFee: number;
  declare platformFee: number;
  declare taxes: number;
  declare discount: number;
  declare promoCode: string | null;
  declare loyaltyPointsUsed: number;
  declare totalAmount: number;
  declare specialInstructions: string | null;
  declare estimatedPreparationTime: number | null;
  declare estimatedDeliveryTime: Date | null;
  declare actualDeliveryTime: Date | null;
  declare isPremiumDelivery: boolean;
  declare restaurantAcceptedAt: Date | null;
  declare driverAcceptedAt: Date | null;
  declare pickedUpAt: Date | null;
  declare deliveredAt: Date | null;
  declare cancelledAt: Date | null;
  declare cancellationReason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
    },
    deliveryPartnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'delivery_partners',
        key: 'id',
      },
    },
    deliveryAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(
        'placed', 'restaurant_notified', 'restaurant_accepted', 'preparing',
        'ready_for_pickup', 'delivery_partner_assigned', 'picked_up',
        'out_for_delivery', 'nearby', 'delivered', 'cancelled',
        'cancelled_by_restaurant', 'cancelled_by_customer', 'refunded', 'failed'
      ),
      defaultValue: 'placed',
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('razorpay', 'paytm', 'wallet', 'cod'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'cod_pending'),
      allowNull: false,
    },
    paymentTransactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
    itemTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    deliveryFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    platformFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    taxes: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    promoCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    loyaltyPointsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedPreparationTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isPremiumDelivery: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    restaurantAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    driverAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['orderNumber'],
      },
      {
        fields: ['customerId'],
      },
      {
        fields: ['restaurantId'],
      },
      {
        fields: ['deliveryPartnerId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['status', 'createdAt'],
      },
    ],
  }
);

export default Order;
