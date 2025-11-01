import { DataTypes, Model, Optional, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '@/config/database';
import { UserRole } from '@/types';

export interface UserAttributes {
  id: string;
  phone: string | null;
  email: string | null;
  passwordHash: string | null;
  name: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending_approval' | 'pending_verification' | 'deleted';
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImageUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt: Date | null;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'phone' | 'email' | 'passwordHash' | 'status' | 'emailVerified' | 'phoneVerified' | 'profileImageUrl' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare phone: string | null;
  declare email: string | null;
  declare passwordHash: string | null;
  declare name: string;
  declare role: UserRole;
  declare status: 'active' | 'suspended' | 'pending_approval' | 'pending_verification' | 'deleted';
  declare emailVerified: boolean;
  declare phoneVerified: boolean;
  declare profileImageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare lastLoginAt: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      unique: true,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('customer', 'restaurant', 'delivery_partner', 'admin', 'super_admin'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'pending_approval', 'pending_verification', 'deleted'),
      defaultValue: 'active',
      allowNull: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    profileImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['phone'],
        where: { phone: { [Op.ne]: null } },
      },
      {
        unique: true,
        fields: ['email'],
        where: { email: { [Op.ne]: null } },
      },
      {
        fields: ['role'],
      },
      {
        fields: ['status'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('passwordHash') && user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
    },
  }
);

export default User;
