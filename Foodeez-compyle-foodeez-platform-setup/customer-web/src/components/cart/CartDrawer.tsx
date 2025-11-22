'use client';

import { X, Plus, Minus, Trash2, IndianRupee, Clock, MapPin } from 'lucide-react';
import { useCartStore, cartUtils } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    restaurant,
    subtotal,
    deliveryFee,
    tax,
    total,
    updateItemQuantity,
    removeItem,
    clearCart,
    setDeliveryAddress,
  } = useCartStore();

  const handleCheckout = () => {
    const validation = cartUtils.validateCart({
      items,
      restaurant,
      deliveryAddress: null,
      specialInstructions: '',
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      deliveryFee,
      tax,
      total,
    });

    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Cart {items.length > 0 && `(${items.length} items)`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
                <Button onClick={onClose}>Browse Restaurants</Button>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {/* Restaurant Info */}
                {restaurant && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={restaurant.imageUrl || '/restaurant-placeholder.jpg'}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{restaurant.avgDeliveryTime}min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <IndianRupee className="w-4 h-4" />
                            <span>{restaurant.deliveryFee} delivery</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.menuItemId}
                      item={item}
                      onUpdateQuantity={(quantity) => updateItemQuantity(item.menuItemId, quantity)}
                      onRemove={() => removeItem(item.menuItemId)}
                    />
                  ))}
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    placeholder="Add any special requests..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 bg-white">
              {/* Order Summary */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{cartUtils.formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{cartUtils.formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-medium">{cartUtils.formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{cartUtils.formatPrice(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 space-y-2">
                <Button
                  size="lg"
                  className="w-full"
                  asChild
                  onClick={handleCheckout}
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface CartItemProps {
  item: any;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      {/* Item Image */}
      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.menuItem.imageUrl || '/food-placeholder.jpg'}
          alt={item.menuItem.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.menuItem.name}</h4>
        <p className="text-sm text-gray-600">
          {cartUtils.formatPrice(item.menuItem.price)} x {item.quantity}
        </p>
        {item.specialInstructions && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            Note: {item.specialInstructions}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Quantity Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}