import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface PromoCodeUsageAttributes {
  id: string;
  promoCodeId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  createdAt?: Date;
}

export interface PromoCodeUsageCreationAttributes extends Optional<PromoCodeUsageAttributes, 'id' | 'createdAt'> {}

class PromoCodeUsage extends Model<PromoCodeUsageAttributes, PromoCodeUsageCreationAttributes> implements PromoCodeUsageAttributes {
  declare id: string;
  declare promoCodeId: string;
  declare userId: string;
  declare orderId: string;
  declare discountAmount: number;
  declare readonly createdAt: Date;
}

PromoCodeUsage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    promoCodeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'promo_codes',
        key: 'id',
      },
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
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    discountAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promo_code_usage',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['promoCodeId', 'userId'],
      },
      {
        fields: ['orderId'],
      },
    ],
  }
);

export default PromoCodeUsage;
