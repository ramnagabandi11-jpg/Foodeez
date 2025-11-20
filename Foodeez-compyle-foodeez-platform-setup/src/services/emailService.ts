import nodemailer from 'nodemailer';
import { Order } from '@/models/postgres';
import { getOrderById } from './orderService';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.File({ filename: 'email-error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
});

// Create reusable transporter
const createTransporter = () => {
  const config = getEmailConfig();

  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Email templates
const getEmailTemplates = {
  welcome: (customerName: string) => ({
    subject: 'Welcome to FoodeeZ! 🍽️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FoodeeZ</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to FoodeeZ!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your delicious food journey begins here 🚀</p>
          </div>

          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${customerName}!</h2>

            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for joining FoodeeZ! We're excited to bring you the best food from your favorite restaurants right to your doorstep.
            </p>

            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>🍔 Browse restaurants and explore delicious menus</li>
                <li>📱 Track your orders in real-time</li>
                <li>💳 Enjoy secure and multiple payment options</li>
                <li>🎁 Earn loyalty points with every order</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://foodeez.com'}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                Start Ordering
              </a>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              If you have any questions, feel free to contact our support team at support@foodeez.com
            </p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #999; font-size: 14px;">
              © 2024 FoodeeZ. All rights reserved. |
              <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> |
              <a href="#" style="color: #667eea; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderConfirmation: (orderData: any) => ({
    subject: `Order Confirmed - ${orderData.orderNumber} 🍽️`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed! ✅</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your delicious food is on its way</p>
          </div>

          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">Order Details</h2>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #666;"><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Restaurant:</strong> ${orderData.restaurantName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Estimated Delivery:</strong> ${orderData.estimatedDeliveryTime}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
            </div>

            <div style="background-color: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #155724;">What's Happening Now?</h3>
              <ol style="color: #155724; line-height: 1.8;">
                <li>📞 Restaurant is confirming your order</li>
                <li>👨‍🍳 Your food is being prepared</li>
                <li>🚚 Delivery partner will be assigned</li>
                <li>🏠 Hot food delivered to your doorstep</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://foodeez.com'}/track-order/${orderData.orderId}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                Track Your Order
              </a>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              Need help? Contact us at support@foodeez.com or call +91 98765 43210
            </p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #999; font-size: 14px;">
              © 2024 FoodeeZ. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  orderStatusUpdate: (orderData: any) => ({
    subject: `Order Update - ${orderData.orderNumber} 🔄`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <div style="background: linear-gradient(135deg, #ffc107 0%, #ff6b6b 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Order Status Update 🔄</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your order status has changed</p>
          </div>

          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">Order ${orderData.orderNumber}</h2>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #856404;">Status: ${orderData.status}</h3>
              <p style="margin: 5px 0 0 0; color: #856404;">${orderData.statusMessage}</p>
            </div>

            ${orderData.estimatedTime ? `
            <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #0c5460;">Estimated Time</h3>
              <p style="margin: 5px 0 0 0; color: #0c5460;">${orderData.estimatedTime}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://foodeez.com'}/track-order/${orderData.orderId}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                Track Order in Real-time
              </a>
            </div>

            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              You can track your order live on our website or mobile app
            </p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #999; font-size: 14px;">
              © 2024 FoodeeZ. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  promotional: (promotion: any) => ({
    subject: promotion.subject || 'Special Offer from FoodeeZ! 🎁',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Special Offer</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

          <div style="background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Special Offer! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Exclusive deals just for you</p>
          </div>

          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">${promotion.title}</h2>

            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${promotion.description}
            </p>

            ${promotion.discountCode ? `
            <div style="background-color: #fff3cd; border: 2px dashed #ffc107; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #856404;">Use Promo Code</h3>
              <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #000; letter-spacing: 2px;">
                ${promotion.discountCode}
              </p>
              <p style="margin: 0; color: #856404;">Valid until ${promotion.validUntil}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://foodeez.com'}/restaurants"
                 style="display: inline-block; background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
                Order Now & Save!
              </a>
            </div>

            ${promotion.termsAndConditions ? `
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 12px; color: #666;">
              <h4 style="margin-top: 0;">Terms & Conditions:</h4>
              <p>${promotion.termsAndConditions}</p>
            </div>
            ` : ''}
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #999; font-size: 14px;">
              © 2024 FoodeeZ. All rights reserved. |
              <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Email sending functions
export const sendWelcomeEmail = async (customerName: string, customerEmail: string) => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplates.welcome(customerName);

    const info = await transporter.sendMail({
      from: `"FoodeeZ" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`Welcome email sent to ${customerEmail}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${customerEmail}:`, error);
    throw error;
  }
};

export const sendOrderConfirmationEmail = async (orderId: string, customerEmail: string) => {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const transporter = createTransporter();
    const template = getEmailTemplates.orderConfirmation({
      orderNumber: order.orderNumber,
      orderId: order.id,
      restaurantName: order.restaurant?.name || 'Restaurant',
      totalAmount: order.totalAmount,
      estimatedDeliveryTime: order.estimatedPreparationTime
        ? `${order.estimatedPreparationTime} minutes`
        : 'Calculating...',
    });

    const info = await transporter.sendMail({
      from: `"FoodeeZ Orders" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`Order confirmation email sent for order ${orderId}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send order confirmation email for order ${orderId}:`, error);
    throw error;
  }
};

export const sendOrderStatusEmail = async (orderId: string, status: string, customerEmail: string) => {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const transporter = createTransporter();

    // Status messages
    const statusMessages: Record<string, string> = {
      'placed': 'Your order has been received and is being confirmed',
      'restaurant_accepted': 'Great! The restaurant has accepted your order and started preparing',
      'preparing': 'Your food is being prepared with care',
      'ready_for_pickup': 'Your order is ready and waiting for delivery partner',
      'picked_up': 'Delivery partner has picked up your order and is on the way',
      'delivered': 'Enjoy your meal! Your order has been delivered',
      'cancelled': 'Your order has been cancelled',
    };

    const statusMessage = statusMessages[status] || 'Your order status has been updated';

    const template = getEmailTemplates.orderStatusUpdate({
      orderNumber: order.orderNumber,
      orderId: order.id,
      status,
      statusMessage,
      estimatedTime: order.estimatedPreparationTime
        ? `${order.estimatedPreparationTime} minutes`
        : null,
    });

    const info = await transporter.sendMail({
      from: `"FoodeeZ Orders" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`Order status email sent for order ${orderId}, status: ${status}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send order status email for order ${orderId}:`, error);
    throw error;
  }
};

export const sendPromotionalEmail = async (customerEmail: string, promotion: any) => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplates.promotional(promotion);

    const info = await transporter.sendMail({
      from: `"FoodeeZ" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`Promotional email sent to ${customerEmail}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Failed to send promotional email to ${customerEmail}:`, error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration is valid');
    return true;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPromotionalEmail,
  testEmailConfiguration,
};