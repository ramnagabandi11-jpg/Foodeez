import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IAuthPayload } from '@/types';

// Extend Socket with user data
interface AuthenticatedSocket extends Socket {
  user?: IAuthPayload;
}

let io: Server;

/**
 * Initialize Socket.io server
 */
export const initializeSocketIO = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        process.env.FRONTEND_URL || 'http://localhost:3001',
      ],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('JWT_SECRET not configured'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as IAuthPayload;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.userId} (${socket.user?.role})`);

    // Join user to their personal room
    socket.join(`user:${socket.user?.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.user?.role}`);

    // Customer-specific handlers
    if (socket.user?.role === 'customer') {
      handleCustomerConnection(socket);
    }

    // Restaurant-specific handlers
    if (socket.user?.role === 'restaurant') {
      handleRestaurantConnection(socket);
    }

    // Delivery partner-specific handlers
    if (socket.user?.role === 'delivery_partner') {
      handleDeliveryPartnerConnection(socket);
    }

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.userId}`);
    });
  });

  console.log('✓ Socket.io initialized');
  return io;
};

/**
 * Handle customer socket connections
 */
const handleCustomerConnection = (socket: AuthenticatedSocket) => {
  // Track order
  socket.on('track:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`Customer ${socket.user?.userId} tracking order ${orderId}`);
  });

  // Stop tracking order
  socket.on('untrack:order', (orderId: string) => {
    socket.leave(`order:${orderId}`);
  });
};

/**
 * Handle restaurant socket connections
 */
const handleRestaurantConnection = (socket: AuthenticatedSocket) => {
  // Join restaurant room
  socket.on('restaurant:join', (restaurantId: string) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`Restaurant ${restaurantId} joined their room`);
  });

  // Accept order
  socket.on('order:accept', (data: { orderId: string; estimatedTime: number }) => {
    // This will be handled by the API, socket just emits the event
    console.log(`Restaurant accepting order ${data.orderId}`);
  });

  // Reject order
  socket.on('order:reject', (data: { orderId: string; reason: string }) => {
    console.log(`Restaurant rejecting order ${data.orderId}`);
  });
};

/**
 * Handle delivery partner socket connections
 */
const handleDeliveryPartnerConnection = (socket: AuthenticatedSocket) => {
  // Update location
  socket.on('location:update', (data: { latitude: number; longitude: number; orderId?: string }) => {
    const { latitude, longitude, orderId } = data;

    // Broadcast location to order tracking room
    if (orderId) {
      io.to(`order:${orderId}`).emit('delivery:location', {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Delivery partner ${socket.user?.userId} location updated`);
  });

  // Accept delivery
  socket.on('delivery:accept', (orderId: string) => {
    console.log(`Delivery partner ${socket.user?.userId} accepting delivery ${orderId}`);
  });

  // Mark picked up
  socket.on('delivery:pickup', (orderId: string) => {
    console.log(`Delivery partner ${socket.user?.userId} picked up order ${orderId}`);
  });
};

/**
 * Emit order status update to relevant users
 */
export const emitOrderStatusUpdate = (
  orderId: string,
  customerId: string,
  restaurantId: string,
  deliveryPartnerId: string | null,
  status: string,
  data?: any
) => {
  if (!io) return;

  const payload = {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Emit to customer
  io.to(`user:${customerId}`).emit('order:status', payload);

  // Emit to order tracking room
  io.to(`order:${orderId}`).emit('order:status', payload);

  // Emit to restaurant
  io.to(`restaurant:${restaurantId}`).emit('order:status', payload);

  // Emit to delivery partner if assigned
  if (deliveryPartnerId) {
    io.to(`user:${deliveryPartnerId}`).emit('order:status', payload);
  }
};

/**
 * Emit new order to restaurant
 */
export const emitNewOrderToRestaurant = (restaurantId: string, orderData: any) => {
  if (!io) return;

  io.to(`restaurant:${restaurantId}`).emit('order:new', {
    order: orderData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit delivery request to delivery partner
 */
export const emitDeliveryRequest = (deliveryPartnerId: string, orderData: any) => {
  if (!io) return;

  io.to(`user:${deliveryPartnerId}`).emit('delivery:request', {
    order: orderData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit delivery location update
 */
export const emitDeliveryLocationUpdate = (
  orderId: string,
  location: { latitude: number; longitude: number }
) => {
  if (!io) return;

  io.to(`order:${orderId}`).emit('delivery:location', {
    ...location,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get Socket.io instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export default {
  initializeSocketIO,
  emitOrderStatusUpdate,
  emitNewOrderToRestaurant,
  emitDeliveryRequest,
  emitDeliveryLocationUpdate,
  getIO,
};
