// Import all models
import User from './User';
import Customer from './Customer';
import Address from './Address';
import Restaurant from './Restaurant';
import DeliveryPartner from './DeliveryPartner';
import Order from './Order';
import OrderItem from './OrderItem';
import Transaction from './Transaction';
import Wallet from './Wallet';
import WalletTransaction from './WalletTransaction';
import RatingReview from './RatingReview';
import PromoCode from './PromoCode';
import PromoCodeUsage from './PromoCodeUsage';
import LoyaltyTransaction from './LoyaltyTransaction';
import Advertisement from './Advertisement';
import AdInteraction from './AdInteraction';
import SupportTicket from './SupportTicket';
import OTPVerification from './OTPVerification';
import AdminUser from './AdminUser';
import AdminActivityLog from './AdminActivityLog';
import FieldVisit from './FieldVisit';
import RestaurantSubscription from './RestaurantSubscription';

// Define associations
// User associations
User.hasOne(Customer, { foreignKey: 'userId', as: 'customer' });
User.hasOne(Restaurant, { foreignKey: 'userId', as: 'restaurant' });
User.hasOne(DeliveryPartner, { foreignKey: 'userId', as: 'deliveryPartner' });
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet' });
User.hasOne(AdminUser, { foreignKey: 'userId', as: 'adminUser' });

// Customer associations
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Customer.hasMany(Address, { foreignKey: 'customerId', as: 'addresses' });
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Customer.hasOne(Wallet, { foreignKey: 'customerId', as: 'wallet' });
Customer.hasMany(LoyaltyTransaction, { foreignKey: 'customerId', as: 'loyaltyTransactions' });
Customer.hasMany(RatingReview, { foreignKey: 'customerId', as: 'reviews' });

// Address associations
Address.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Address.hasMany(Order, { foreignKey: 'deliveryAddressId', as: 'orders' });

// Restaurant associations
Restaurant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
Restaurant.hasMany(RestaurantSubscription, { foreignKey: 'restaurantId', as: 'subscriptions' });
Restaurant.hasOne(Wallet, { foreignKey: 'restaurantId', as: 'wallet' });
Restaurant.hasMany(RatingReview, { foreignKey: 'restaurantId', as: 'reviews' });
Restaurant.hasMany(FieldVisit, { foreignKey: 'restaurantId', as: 'fieldVisits' });

// DeliveryPartner associations
DeliveryPartner.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DeliveryPartner.hasMany(Order, { foreignKey: 'deliveryPartnerId', as: 'orders' });
DeliveryPartner.hasOne(Wallet, { foreignKey: 'deliveryPartnerId', as: 'wallet' });
DeliveryPartner.hasMany(RatingReview, { foreignKey: 'deliveryPartnerId', as: 'reviews' });
DeliveryPartner.hasMany(FieldVisit, { foreignKey: 'deliveryPartnerId', as: 'fieldVisits' });

// Order associations
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Order.belongsTo(DeliveryPartner, { foreignKey: 'deliveryPartnerId', as: 'deliveryPartner' });
Order.belongsTo(Address, { foreignKey: 'deliveryAddressId', as: 'deliveryAddress' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
Order.hasMany(Transaction, { foreignKey: 'orderId', as: 'transactions' });
Order.hasOne(RatingReview, { foreignKey: 'orderId', as: 'review' });
Order.hasMany(PromoCodeUsage, { foreignKey: 'orderId', as: 'promoUsages' });
Order.hasMany(LoyaltyTransaction, { foreignKey: 'orderId', as: 'loyaltyTransactions' });
Order.hasMany(SupportTicket, { foreignKey: 'orderId', as: 'supportTickets' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Transaction associations
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Transaction.hasMany(WalletTransaction, { foreignKey: 'transactionId', as: 'walletTransactions' });
Transaction.hasMany(RestaurantSubscription, { foreignKey: 'transactionId', as: 'subscriptions' });

// Wallet associations
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Wallet.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Wallet.belongsTo(DeliveryPartner, { foreignKey: 'deliveryPartnerId', as: 'deliveryPartner' });
Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId', as: 'transactions' });

// WalletTransaction associations
WalletTransaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
WalletTransaction.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// RatingReview associations
RatingReview.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
RatingReview.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
RatingReview.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
RatingReview.belongsTo(DeliveryPartner, { foreignKey: 'deliveryPartnerId', as: 'deliveryPartner' });

// PromoCode associations
PromoCode.hasMany(PromoCodeUsage, { foreignKey: 'promoCodeId', as: 'usages' });

// PromoCodeUsage associations
PromoCodeUsage.belongsTo(PromoCode, { foreignKey: 'promoCodeId', as: 'promoCode' });
PromoCodeUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PromoCodeUsage.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// LoyaltyTransaction associations
LoyaltyTransaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
LoyaltyTransaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Advertisement associations
Advertisement.hasMany(AdInteraction, { foreignKey: 'advertisementId', as: 'interactions' });

// AdInteraction associations
AdInteraction.belongsTo(Advertisement, { foreignKey: 'advertisementId', as: 'advertisement' });
AdInteraction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SupportTicket associations
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SupportTicket.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
SupportTicket.belongsTo(AdminUser, { foreignKey: 'assignedTo', as: 'assignedAdmin' });

// AdminUser associations
AdminUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AdminUser.hasMany(SupportTicket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
AdminUser.hasMany(AdminActivityLog, { foreignKey: 'adminUserId', as: 'activityLogs' });
AdminUser.hasMany(FieldVisit, { foreignKey: 'areaManagerId', as: 'fieldVisits' });

// AdminActivityLog associations
AdminActivityLog.belongsTo(AdminUser, { foreignKey: 'adminUserId', as: 'adminUser' });

// FieldVisit associations
FieldVisit.belongsTo(AdminUser, { foreignKey: 'areaManagerId', as: 'areaManager' });
FieldVisit.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
FieldVisit.belongsTo(DeliveryPartner, { foreignKey: 'deliveryPartnerId', as: 'deliveryPartner' });

// RestaurantSubscription associations
RestaurantSubscription.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
RestaurantSubscription.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// Export all models
export {
  User,
  Customer,
  Address,
  Restaurant,
  DeliveryPartner,
  Order,
  OrderItem,
  Transaction,
  Wallet,
  WalletTransaction,
  RatingReview,
  PromoCode,
  PromoCodeUsage,
  LoyaltyTransaction,
  Advertisement,
  AdInteraction,
  SupportTicket,
  OTPVerification,
  AdminUser,
  AdminActivityLog,
  FieldVisit,
  RestaurantSubscription,
};

export default {
  User,
  Customer,
  Address,
  Restaurant,
  DeliveryPartner,
  Order,
  OrderItem,
  Transaction,
  Wallet,
  WalletTransaction,
  RatingReview,
  PromoCode,
  PromoCodeUsage,
  LoyaltyTransaction,
  Advertisement,
  AdInteraction,
  SupportTicket,
  OTPVerification,
  AdminUser,
  AdminActivityLog,
  FieldVisit,
  RestaurantSubscription,
};
