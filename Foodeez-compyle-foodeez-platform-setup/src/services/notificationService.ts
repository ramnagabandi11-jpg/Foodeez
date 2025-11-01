import twilio from 'twilio';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';
import { User } from '@/models/postgres';
import { NotFoundError } from '@/utils/errors';

// Initialize Twilio (for SMS)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize AWS SES (for Email)
AWS.config.update({
  region: process.env.AWS_SES_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// Initialize Nodemailer with SES transport
const emailTransporter = nodemailer.createTransport({
  SES: { ses, aws: AWS },
});

/**
 * Send SMS via Twilio
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<void> => {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio not configured, skipping SMS');
      return;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    // Don't throw error - notifications are non-critical
  }
};

/**
 * Send email via AWS SES
 */
export const sendEmail = async (
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.AWS_SES_FROM_EMAIL || 'noreply@foodeez.com',
      to,
      subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw error - notifications are non-critical
  }
};

/**
 * Send push notification (placeholder - integrate with Firebase or OneSignal)
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    // TODO: Integrate with Firebase Cloud Messaging or OneSignal
    console.log(`Push notification to user ${userId}: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Data:`, data);

    // Placeholder implementation
    // In production, use FCM or OneSignal SDK
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

/**
 * Send order confirmation notification
 */
export const sendOrderConfirmation = async (
  userId: string,
  orderDetails: {
    orderNumber: string;
    restaurantName: string;
    totalAmount: number;
    estimatedTime: number;
  }
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { orderNumber, restaurantName, totalAmount, estimatedTime } = orderDetails;

  // Send SMS
  if (user.phone) {
    const smsMessage = `Your order ${orderNumber} from ${restaurantName} has been confirmed! Total: ₹${totalAmount}. Estimated time: ${estimatedTime} mins.`;
    await sendSMS(user.phone, smsMessage);
  }

  // Send Email
  if (user.email) {
    const emailSubject = `Order Confirmed - ${orderNumber}`;
    const emailBody = `
      <h2>Order Confirmed!</h2>
      <p>Thank you for your order from <strong>${restaurantName}</strong>.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p><strong>Estimated Delivery Time:</strong> ${estimatedTime} minutes</p>
      <p>You'll receive updates as your order progresses.</p>
    `;
    await sendEmail(user.email, emailSubject, emailBody);
  }

  // Send Push Notification
  await sendPushNotification(
    userId,
    'Order Confirmed!',
    `Your order from ${restaurantName} has been confirmed.`,
    { orderNumber, type: 'order_confirmed' }
  );
};

/**
 * Send order status update notification
 */
export const sendOrderStatusUpdate = async (
  userId: string,
  orderDetails: {
    orderNumber: string;
    status: string;
    statusMessage: string;
  }
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { orderNumber, status, statusMessage } = orderDetails;

  // Send SMS for critical statuses
  if (user.phone && ['out_for_delivery', 'delivered'].includes(status)) {
    await sendSMS(user.phone, `Order ${orderNumber}: ${statusMessage}`);
  }

  // Send Push Notification
  await sendPushNotification(
    userId,
    `Order ${orderNumber}`,
    statusMessage,
    { orderNumber, status, type: 'order_status_update' }
  );
};

/**
 * Send delivery partner assignment notification
 */
export const sendDeliveryAssigned = async (
  userId: string,
  orderDetails: {
    orderNumber: string;
    deliveryPartnerName: string;
    deliveryPartnerPhone: string;
  }
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { orderNumber, deliveryPartnerName, deliveryPartnerPhone } = orderDetails;

  // Send Push Notification
  await sendPushNotification(
    userId,
    'Delivery Partner Assigned',
    `${deliveryPartnerName} is delivering your order ${orderNumber}`,
    { orderNumber, deliveryPartnerPhone, type: 'delivery_assigned' }
  );
};

/**
 * Send order delivered notification
 */
export const sendOrderDelivered = async (
  userId: string,
  orderDetails: {
    orderNumber: string;
    restaurantName: string;
  }
): Promise<void> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { orderNumber, restaurantName } = orderDetails;

  // Send SMS
  if (user.phone) {
    await sendSMS(
      user.phone,
      `Your order ${orderNumber} from ${restaurantName} has been delivered! Enjoy your meal!`
    );
  }

  // Send Push Notification
  await sendPushNotification(
    userId,
    'Order Delivered!',
    `Your order from ${restaurantName} has been delivered. Enjoy!`,
    { orderNumber, type: 'order_delivered' }
  );
};

/**
 * Send new order notification to restaurant
 */
export const sendNewOrderToRestaurant = async (
  restaurantUserId: string,
  orderDetails: {
    orderNumber: string;
    customerName: string;
    itemCount: number;
    totalAmount: number;
  }
): Promise<void> => {
  const user = await User.findByPk(restaurantUserId);

  if (!user) {
    throw new NotFoundError('Restaurant user not found');
  }

  const { orderNumber, customerName, itemCount, totalAmount } = orderDetails;

  // Send SMS
  if (user.phone) {
    await sendSMS(
      user.phone,
      `New order ${orderNumber} from ${customerName}. ${itemCount} items, ₹${totalAmount}. Please accept!`
    );
  }

  // Send Push Notification
  await sendPushNotification(
    restaurantUserId,
    'New Order Received!',
    `Order ${orderNumber} from ${customerName} - ₹${totalAmount}`,
    { orderNumber, type: 'new_order' }
  );
};

/**
 * Send delivery request to delivery partner
 */
export const sendDeliveryRequest = async (
  deliveryPartnerUserId: string,
  orderDetails: {
    orderNumber: string;
    restaurantName: string;
    deliveryFee: number;
    distance: number;
  }
): Promise<void> => {
  const user = await User.findByPk(deliveryPartnerUserId);

  if (!user) {
    throw new NotFoundError('Delivery partner user not found');
  }

  const { orderNumber, restaurantName, deliveryFee, distance } = orderDetails;

  // Send Push Notification
  await sendPushNotification(
    deliveryPartnerUserId,
    'New Delivery Request',
    `${restaurantName} - ${distance}km away. Earn ₹${deliveryFee}`,
    { orderNumber, deliveryFee, distance, type: 'delivery_request' }
  );
};

export default {
  sendSMS,
  sendEmail,
  sendPushNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendDeliveryAssigned,
  sendOrderDelivered,
  sendNewOrderToRestaurant,
  sendDeliveryRequest,
};
