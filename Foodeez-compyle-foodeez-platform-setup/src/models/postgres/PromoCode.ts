import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface PromoCodeAttributes {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  totalUsageLimit: number | null;
  currentUsageCount: number;
  applicableUserTypes: ('customer' | 'all')[];
  applicableRestaurants: string[];
  applicableCities: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromoCodeCreationAttributes extends Optional<PromoCodeAttributes, 'id' | 'maxDiscountAmount' | 'minOrderValue' | 'usageLimit' | 'totalUsageLimit' | 'currentUsageCount' | 'applicableUserTypes' | 'applicableRestaurants' | 'applicableCities' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class PromoCode extends Model<PromoCodeAttributes, PromoCodeCreationAttributes> implements PromoCodeAttributes {
  declare id: string;
  declare code: string;
  declare description: string;
  declare discountType: 'percentage' | 'fixed';
  declare discountValue: number;
  declare maxDiscountAmount: number | null;
  declare minOrderValue: number;
  declare validFrom: Date;
  declare validUntil: Date;
  declare usageLimit: number;
  declare totalUsageLimit: number | null;
  declare currentUsageCount: number;
  declare applicableUserTypes: ('customer' | 'all')[];
  declare applicableRestaurants: string[];
  declare applicableCities: string[];
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PromoCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    maxDiscountAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    minOrderValue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    totalUsageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentUsageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    applicableUserTypes: {
      type: DataTypes.ARRAY(DataTypes.ENUM('customer', 'all')),
      defaultValue: ['customer'],
      allowNull: false,
    },
    applicableRestaurants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: false,
    },
    applicableCities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promo_codes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['validFrom', 'validUntil'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export default PromoCode;
