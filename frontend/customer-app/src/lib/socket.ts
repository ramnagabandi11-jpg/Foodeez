import { io, Socket } from 'socket.io-client';
import type { User } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private user: User | null = null;

  // Initialize socket connection
  connect(user: User): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.user = user;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    this.socket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      // Join user-specific room
      this.socket?.emit('user:join', { userId: this.user?.userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  // Order related events
  onOrderStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on('order:status', callback);
  }

  onNewOrderNotification(callback: (data: any) => void): void {
    this.socket?.on('order:new', callback);
  }

  // Location tracking events
  onDeliveryLocationUpdate(callback: (data: any) => void): void {
    this.socket?.on('delivery:location', callback);
  }

  // Track an order
  trackOrder(orderId: string): void {
    this.socket?.emit('track:order', orderId);
  }

  // Stop tracking an order
  untrackOrder(orderId: string): void {
    this.socket?.emit('untrack:order', orderId);
  }

  // Join restaurant room (for restaurant staff)
  joinRestaurant(restaurantId: string): void {
    this.socket?.emit('restaurant:join', restaurantId);
  }

  // Leave restaurant room
  leaveRestaurant(restaurantId: string): void {
    this.socket?.emit('restaurant:leave', restaurantId);
  }

  // Accept order (for restaurant staff)
  acceptOrder(orderId: string, estimatedTime: number): void {
    this.socket?.emit('order:accept', { orderId, estimatedTime });
  }

  // Reject order (for restaurant staff)
  rejectOrder(orderId: string, reason: string): void {
    this.socket?.emit('order:reject', { orderId, reason });
  }

  // Update location (for delivery partners)
  updateLocation(latitude: number, longitude: number, orderId?: string): void {
    this.socket?.emit('location:update', { latitude, longitude, orderId });
  }

  // Accept delivery (for delivery partners)
  acceptDelivery(orderId: string): void {
    this.socket?.emit('delivery:accept', orderId);
  }

  // Mark order as picked up (for delivery partners)
  markPickedUp(orderId: string): void {
    this.socket?.emit('delivery:pickup', orderId);
  }

  // Listen for restaurant approvals
  onRestaurantApproval(callback: (data: any) => void): void {
    this.socket?.on('restaurant_approved', callback);
  }

  // Listen for review additions
  onReviewAdded(callback: (data: any) => void): void {
    this.socket?.on('review_added', callback);
  }

  // Get socket instance for custom event handling
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// React hook for socket service
export function useSocket() {
  return socketService;
}