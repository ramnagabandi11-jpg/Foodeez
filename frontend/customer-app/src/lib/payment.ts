import Razorpay from 'razorpay';
import { Order } from '@/types';

interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
    escape: boolean;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private isLoaded = false;

  constructor() {
    this.loadRazorpay();
  }

  private loadRazorpay(): void {
    if (typeof window === 'undefined') return;

    // Load Razorpay script if not already loaded
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.isLoaded = true;
      };
      document.body.appendChild(script);
    } else {
      this.isLoaded = true;
    }
  }

  async initializePayment(
    order: Order,
    user: { name: string; email: string; phone: string },
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: any) => void,
    onDismiss?: () => void
  ): Promise<void> {
    if (!this.isLoaded) {
      throw new Error('Payment gateway not loaded');
    }

    const options: PaymentOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY!,
      amount: order.totalAmount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Foodeez',
      description: `Order ${order.orderNumber}`,
      order_id: order.id, // If you have an order_id from Razorpay
      handler: (response) => {
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
        },
        escape: true,
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
      theme: {
        color: '#ef4444', // Primary red color
      },
    };

    try {
      this.razorpay = new Razorpay(options);
      this.razorpay.on('payment.failed', (response: any) => {
        onFailure(response.error);
      });

      this.razorpay.open();
    } catch (error) {
      onFailure(error);
    }
  }

  async createOrder(amount: number, currency: string = 'INR'): Promise<any> {
    try {
      // This should make an API call to your backend to create a Razorpay order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency,
          receipt: `foodeez_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ): Promise<boolean> {
    try {
      // This should make an API call to your backend to verify the payment
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async processRefund(
    orderId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const response = await fetch(`/api/payment/refund/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          amount: amount ? amount * 100 : undefined, // Convert to paise if amount is provided
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Refund processing failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Add money to wallet
  async addMoneyToWallet(
    amount: number,
    user: { name: string; email: string; phone: string },
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: any) => void
  ): Promise<void> {
    try {
      // Create a wallet order
      const orderData = await this.createOrder(amount);

      const options: PaymentOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Foodeez',
        description: `Add ₹${amount} to wallet`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            // Verify payment
            const isValid = await this.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (isValid) {
              // Add money to wallet
              await this.addMoneyToBackend(response.razorpay_payment_id, amount);
              onSuccess(response);
            } else {
              onFailure(new Error('Payment verification failed'));
            }
          } catch (error) {
            onFailure(error);
          }
        },
        modal: {
          ondismiss: () => {
            onFailure(new Error('Payment cancelled'));
          },
          escape: true,
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#22c55e', // Green for wallet
        },
      };

      this.razorpay = new Razorpay(options);
      this.razorpay.open();
    } catch (error) {
      onFailure(error);
    }
  }

  private async addMoneyToBackend(paymentId: string, amount: number): Promise<void> {
    const response = await fetch('/api/payment/wallet/add-money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        paymentId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add money to wallet');
    }
  }

  // Payment status check
  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const response = await fetch(`/api/payment/status/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// React hook for payment service
export function usePayment() {
  return paymentService;
}