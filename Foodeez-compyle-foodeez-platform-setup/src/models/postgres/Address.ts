import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AddressAttributes {
  id: string;
  customerId: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressCreationAttributes extends Optional<AddressAttributes, 'id' | 'addressLine2' | 'landmark' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  declare id: string;
  declare customerId: string;
  declare label: string;
  declare addressLine1: string;
  declare addressLine2: string | null;
  declare landmark: string | null;
  declare city: string;
  declare state: string;
  declare pincode: string;
  declare latitude: number;
  declare longitude: number;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Address.init(
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
      onDelete: 'CASCADE',
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    landmark: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'addresses',
    timestamps: true,
    indexes: [
      {
        fields: ['customerId'],
      },
      {
        fields: ['customerId', 'isDefault'],
      },
    ],
  }
);

export default Address;
