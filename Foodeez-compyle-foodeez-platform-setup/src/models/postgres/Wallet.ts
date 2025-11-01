import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '@/config/database';

export interface WalletAttributes {
  id: string;
  userId: string;
  customerId: string | null;
  restaurantId: string | null;
  deliveryPartnerId: string | null;
  balance: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'customerId' | 'restaurantId' | 'deliveryPartnerId' | 'balance' | 'currency' | 'createdAt' | 'updatedAt'> {}

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  declare id: string;
  declare userId: string;
  declare customerId: string | null;
  declare restaurantId: string | null;
  declare deliveryPartnerId: string | null;
  declare balance: number;
  declare currency: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Wallet.init(
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
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: {
        model: 'restaurants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    deliveryPartnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: {
        model: 'delivery_partners',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['customerId'],
        where: {
          customerId: { [Op.ne]: null },
        },
      },
      {
        unique: true,
        fields: ['restaurantId'],
        where: {
          restaurantId: { [Op.ne]: null },
        },
      },
      {
        unique: true,
        fields: ['deliveryPartnerId'],
        where: {
          deliveryPartnerId: { [Op.ne]: null },
        },
      },
    ],
  }
);

export default Wallet;
