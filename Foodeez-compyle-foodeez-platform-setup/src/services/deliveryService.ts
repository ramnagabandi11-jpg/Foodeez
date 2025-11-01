import { Op } from 'sequelize';
import { DeliveryPartner, Order, Restaurant, Address } from '@/models/postgres';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { redisClient } from '@/config/redis';

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find nearby available delivery partners
 */
export const findNearbyDeliveryPartners = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<DeliveryPartner[]> => {
  try {
    // Get all online and available delivery partners
    const partners = await DeliveryPartner.findAll({
      where: {
        isOnline: true,
        isAvailable: true,
        currentLatitude: { [Op.ne]: null },
        currentLongitude: { [Op.ne]: null },
      },
    });

    // Filter by distance
    const nearbyPartners = partners.filter((partner) => {
      if (!partner.currentLatitude || !partner.currentLongitude) {
        return false;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        partner.currentLatitude,
        partner.currentLongitude
      );

      return distance <= radiusKm;
    });

    // Sort by distance
    nearbyPartners.sort((a, b) => {
      const distA = calculateDistance(
        latitude,
        longitude,
        a.currentLatitude!,
        a.currentLongitude!
      );
      const distB = calculateDistance(
        latitude,
        longitude,
        b.currentLatitude!,
        b.currentLongitude!
      );
      return distA - distB;
    });

    return nearbyPartners;
  } catch (error) {
    console.error('Failed to find nearby delivery partners:', error);
    return [];
  }
};

/**
 * Assign delivery partner to order
 */
export const assignDeliveryPartner = async (
  orderId: string
): Promise<{ deliveryPartnerId: string; distance: number } | null> => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Restaurant, as: 'restaurant' },
      { model: Address, as: 'deliveryAddress' },
    ],
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const restaurant = order.restaurant as any;
  const deliveryAddress = order.deliveryAddress as any;

  if (!restaurant || !deliveryAddress) {
    throw new ValidationError('Restaurant or delivery address not found');
  }

  // Find nearby delivery partners from restaurant location
  const nearbyPartners = await findNearbyDeliveryPartners(
    restaurant.latitude,
    restaurant.longitude,
    10 // 10km radius
  );

  if (nearbyPartners.length === 0) {
    console.log(`No delivery partners available for order ${order.orderNumber}`);
    return null;
  }

  // Select the best delivery partner (closest with good ratings)
  let bestPartner = nearbyPartners[0];
  let bestScore = 0;

  for (const partner of nearbyPartners.slice(0, 5)) {
    // Check top 5 partners
    const distance = calculateDistance(
      restaurant.latitude,
      restaurant.longitude,
      partner.currentLatitude!,
      partner.currentLongitude!
    );

    // Score = (rating * 10) - distance
    // Prefer partners with high ratings and close distance
    const score = partner.averageRating * 10 - distance;

    if (score > bestScore) {
      bestScore = score;
      bestPartner = partner;
    }
  }

  // Assign delivery partner to order
  await order.update({
    deliveryPartnerId: bestPartner.id,
    status: 'delivery_partner_assigned',
    driverAcceptedAt: new Date(),
  });

  // Mark delivery partner as unavailable
  await bestPartner.update({ isAvailable: false });

  const distance = calculateDistance(
    restaurant.latitude,
    restaurant.longitude,
    bestPartner.currentLatitude!,
    bestPartner.currentLongitude!
  );

  return {
    deliveryPartnerId: bestPartner.id,
    distance,
  };
};

/**
 * Update delivery partner location
 */
export const updateDeliveryPartnerLocation = async (
  deliveryPartnerId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  const partner = await DeliveryPartner.findByPk(deliveryPartnerId);

  if (!partner) {
    throw new NotFoundError('Delivery partner not found');
  }

  await partner.update({
    currentLatitude: latitude,
    currentLongitude: longitude,
  });

  // Store in Redis for real-time tracking (geospatial data)
  try {
    await redisClient.geoadd(
      'delivery_partners:locations',
      longitude,
      latitude,
      deliveryPartnerId
    );
  } catch (error) {
    console.error('Failed to update Redis geolocation:', error);
  }
};

/**
 * Get delivery partner current location
 */
export const getDeliveryPartnerLocation = async (
  deliveryPartnerId: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    // Try Redis first for real-time data
    const position = await redisClient.geopos(
      'delivery_partners:locations',
      deliveryPartnerId
    );

    if (position && position[0]) {
      return {
        longitude: position[0][0],
        latitude: position[0][1],
      };
    }
  } catch (error) {
    console.error('Redis geolocation fetch failed:', error);
  }

  // Fallback to database
  const partner = await DeliveryPartner.findByPk(deliveryPartnerId);

  if (partner && partner.currentLatitude && partner.currentLongitude) {
    return {
      latitude: partner.currentLatitude,
      longitude: partner.currentLongitude,
    };
  }

  return null;
};

/**
 * Set delivery partner online status
 */
export const setDeliveryPartnerStatus = async (
  deliveryPartnerId: string,
  isOnline: boolean,
  isAvailable?: boolean
): Promise<void> => {
  const partner = await DeliveryPartner.findByPk(deliveryPartnerId);

  if (!partner) {
    throw new NotFoundError('Delivery partner not found');
  }

  const updates: any = { isOnline };

  if (isAvailable !== undefined) {
    updates.isAvailable = isAvailable;
  }

  // If going offline, mark as unavailable
  if (!isOnline) {
    updates.isAvailable = false;
  }

  await partner.update(updates);
};

/**
 * Complete delivery
 */
export const completeDelivery = async (
  orderId: string,
  deliveryPartnerId: string
): Promise<void> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.deliveryPartnerId !== deliveryPartnerId) {
    throw new ValidationError('Delivery partner mismatch');
  }

  // Update order status
  await order.update({
    status: 'delivered',
    deliveredAt: new Date(),
    actualDeliveryTime: new Date(),
  });

  // Mark delivery partner as available again
  const partner = await DeliveryPartner.findByPk(deliveryPartnerId);
  if (partner) {
    await partner.update({ isAvailable: true });
    await partner.increment('totalDeliveries');
  }
};

export default {
  findNearbyDeliveryPartners,
  assignDeliveryPartner,
  updateDeliveryPartnerLocation,
  getDeliveryPartnerLocation,
  setDeliveryPartnerStatus,
  completeDelivery,
};
