import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '@/config/database';

export interface OTPVerificationAttributes {
  id: string;
  phoneOrEmail: string;
  otp: string;
  purpose: 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'email_verification';
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  verifiedAt: Date | null;
  createdAt?: Date;
}

export interface OTPVerificationCreationAttributes extends Optional<OTPVerificationAttributes, 'id' | 'attempts' | 'isVerified' | 'verifiedAt' | 'createdAt'> {}

class OTPVerification extends Model<OTPVerificationAttributes, OTPVerificationCreationAttributes> implements OTPVerificationAttributes {
  declare id: string;
  declare phoneOrEmail: string;
  declare otp: string;
  declare purpose: 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'email_verification';
  declare attempts: number;
  declare isVerified: boolean;
  declare expiresAt: Date;
  declare verifiedAt: Date | null;
  declare readonly createdAt: Date;
}

OTPVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phoneOrEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM('registration', 'login', 'password_reset', 'phone_verification', 'email_verification'),
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'otp_verifications',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['phoneOrEmail', 'purpose', 'isVerified'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
    hooks: {
      beforeCreate: async (otpVerification: OTPVerification) => {
        if (otpVerification.otp) {
          otpVerification.otp = await bcrypt.hash(otpVerification.otp, 10);
        }
      },
    },
  }
);

export default OTPVerification;
