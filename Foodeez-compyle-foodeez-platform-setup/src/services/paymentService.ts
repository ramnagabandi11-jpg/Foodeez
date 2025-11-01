import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Order, Transaction, Wallet, WalletTransaction } from '@/models/postgres';
import {
  NotFoundError,
  ValidationError,
  PaymentFailedError,
  InsufficientWalletBalanceError,
} from '@/utils/errors';
import { PaymentMethod } from '@/types';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Generate unique transaction number
 */
const generateTransactionNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

/**
 * Initiate payment with Razorpay
 */
export const initiateRazorpayPayment = async (orderId: string): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  key: string;
}> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.paymentStatus === 'paid') {
    throw new ValidationError('Order already paid');
  }

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Create transaction record
    await Transaction.create({
      transactionNumber: generateTransactionNumber(),
      type: 'payment',
      userId: order.customerId,
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'INR',
      paymentGateway: 'razorpay',
      gatewayTransactionId: razorpayOrder.id,
      status: 'pending',
      gatewayResponse: razorpayOrder,
    });

    return {
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID || '',
    };
  } catch (error) {
    throw new PaymentFailedError('Failed to initiate payment');
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyRazorpayPayment = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ orderId: string; status: string }> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new PaymentFailedError('Invalid payment signature');
  }

  // Find transaction
  const transaction = await Transaction.findOne({
    where: { gatewayTransactionId: razorpayOrderId },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Update transaction
  await transaction.update({
    status: 'completed',
    gatewayResponse: {
      ...transaction.gatewayResponse,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    },
  });

  // Update order payment status
  const order = await Order.findByPk(transaction.orderId);
  if (order) {
    await order.update({
      paymentStatus: 'paid',
      paymentTransactionId: transaction.id,
    });
  }

  return {
    orderId: transaction.orderId!,
    status: 'completed',
  };
};

/**
 * Process wallet payment
 */
export const processWalletPayment = async (
  orderId: string,
  userId: string
): Promise<{ orderId: string; status: string }> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.paymentStatus === 'paid') {
    throw new ValidationError('Order already paid');
  }

  // Get user wallet
  const wallet = await Wallet.findOne({ where: { userId } });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  if (wallet.balance < order.totalAmount) {
    throw new InsufficientWalletBalanceError(
      `Insufficient balance. Required: ₹${order.totalAmount}, Available: ₹${wallet.balance}`
    );
  }

  // Deduct from wallet
  const balanceBefore = wallet.balance;
  await wallet.decrement('balance', { by: order.totalAmount });
  const balanceAfter = wallet.balance - order.totalAmount;

  // Create transaction
  const transaction = await Transaction.create({
    transactionNumber: generateTransactionNumber(),
    type: 'payment',
    userId,
    orderId: order.id,
    amount: order.totalAmount,
    currency: 'INR',
    paymentGateway: 'wallet',
    status: 'completed',
  });

  // Create wallet transaction
  await WalletTransaction.create({
    walletId: wallet.id,
    transactionId: transaction.id,
    type: 'debit',
    amount: order.totalAmount,
    balanceBefore,
    balanceAfter,
    description: `Payment for order ${order.orderNumber}`,
  });

  // Update order payment status
  await order.update({
    paymentStatus: 'paid',
    paymentTransactionId: transaction.id,
  });

  return {
    orderId: order.id,
    status: 'completed',
  };
};

/**
 * Add money to wallet via Razorpay
 */
export const addMoneyToWallet = async (
  userId: string,
  amount: number
): Promise<{
  amount: number;
  currency: string;
  razorpayOrderId: string;
  key: string;
}> => {
  if (amount < 100 || amount > 50000) {
    throw new ValidationError('Amount must be between ₹100 and ₹50,000');
  }

  const wallet = await Wallet.findOne({ where: { userId } });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `WALLET-${Date.now()}`,
      notes: {
        userId,
        purpose: 'wallet_credit',
      },
    });

    // Create transaction record
    await Transaction.create({
      transactionNumber: generateTransactionNumber(),
      type: 'wallet_credit',
      userId,
      amount,
      currency: 'INR',
      paymentGateway: 'razorpay',
      gatewayTransactionId: razorpayOrder.id,
      status: 'pending',
      gatewayResponse: razorpayOrder,
    });

    return {
      amount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID || '',
    };
  } catch (error) {
    throw new PaymentFailedError('Failed to initiate wallet credit');
  }
};

/**
 * Verify wallet credit payment
 */
export const verifyWalletCredit = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ walletId: string; newBalance: number }> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new PaymentFailedError('Invalid payment signature');
  }

  // Find transaction
  const transaction = await Transaction.findOne({
    where: { gatewayTransactionId: razorpayOrderId, type: 'wallet_credit' },
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Update transaction
  await transaction.update({
    status: 'completed',
    gatewayResponse: {
      ...transaction.gatewayResponse,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    },
  });

  // Credit wallet
  const wallet = await Wallet.findOne({ where: { userId: transaction.userId } });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  const balanceBefore = wallet.balance;
  await wallet.increment('balance', { by: transaction.amount });
  const balanceAfter = wallet.balance + transaction.amount;

  // Create wallet transaction
  await WalletTransaction.create({
    walletId: wallet.id,
    transactionId: transaction.id,
    type: 'credit',
    amount: transaction.amount,
    balanceBefore,
    balanceAfter,
    description: `Wallet credit via Razorpay`,
  });

  return {
    walletId: wallet.id,
    newBalance: balanceAfter,
  };
};

/**
 * Process refund
 */
export const processRefund = async (
  orderId: string,
  reason: string
): Promise<{ orderId: string; refundAmount: number; status: string }> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.paymentStatus !== 'paid') {
    throw new ValidationError('Order not paid, cannot refund');
  }

  const refundAmount = order.totalAmount;

  // Get original payment transaction
  const paymentTransaction = await Transaction.findByPk(order.paymentTransactionId!);

  if (!paymentTransaction) {
    throw new NotFoundError('Payment transaction not found');
  }

  // Create refund transaction
  const refundTransaction = await Transaction.create({
    transactionNumber: generateTransactionNumber(),
    type: 'refund',
    userId: order.customerId,
    orderId: order.id,
    amount: refundAmount,
    currency: 'INR',
    paymentGateway: paymentTransaction.paymentGateway,
    status: 'completed',
    metadata: { reason },
  });

  // If paid via wallet, credit back to wallet
  if (paymentTransaction.paymentGateway === 'wallet') {
    const wallet = await Wallet.findOne({ where: { userId: order.customerId } });

    if (wallet) {
      const balanceBefore = wallet.balance;
      await wallet.increment('balance', { by: refundAmount });
      const balanceAfter = wallet.balance + refundAmount;

      await WalletTransaction.create({
        walletId: wallet.id,
        transactionId: refundTransaction.id,
        type: 'credit',
        amount: refundAmount,
        balanceBefore,
        balanceAfter,
        description: `Refund for order ${order.orderNumber}`,
      });
    }
  }

  // Update order status
  await order.update({
    paymentStatus: 'refunded',
    status: 'refunded',
  });

  return {
    orderId: order.id,
    refundAmount,
    status: 'completed',
  };
};

export default {
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  processWalletPayment,
  addMoneyToWallet,
  verifyWalletCredit,
  processRefund,
};
