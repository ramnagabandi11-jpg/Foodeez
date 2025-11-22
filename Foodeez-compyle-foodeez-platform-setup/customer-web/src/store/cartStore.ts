import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Restaurant, MenuItem, CartItem, Address } from '@/lib/api';
import toast from 'react-hot-toast';

interface CartState {
  items: CartItem[];
  restaurant: Restaurant | null;
  deliveryAddress: Address | null;
  specialInstructions: string;

  // Computed values
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;

  // Actions
  addItem: (menuItem: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateItemQuantity: (menuItemId: string, quantity: number) => void;
  updateItemInstructions: (menuItemId: string, specialInstructions: string) => void;
  clearCart: () => void;
  setRestaurant: (restaurant: Restaurant) => void;
  setDeliveryAddress: (address: Address) => void;
  setSpecialInstructions: (instructions: string) => void;
  isRestaurantAvailable: () => boolean;
}

const TAX_RATE = 0.05; // 5% tax
const DEFAULT_DELIVERY_FEE = 30; // Rs. 30

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurant: null,
      deliveryAddress: null,
      specialInstructions: '',

      // Computed values
      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      get deliveryFee() {
        const { restaurant } = get();
        return restaurant?.deliveryFee || DEFAULT_DELIVERY_FEE;
      },

      get tax() {
        return get().subtotal * TAX_RATE;
      },

      get total() {
        const { subtotal, deliveryFee, tax } = get();
        return subtotal + deliveryFee + tax;
      },

      addItem: (menuItem: MenuItem, quantity = 1, specialInstructions?: string) => {
        const { items, restaurant } = get();

        // Check if item is available
        if (!menuItem.isAvailable) {
          toast.error(`${menuItem.name} is currently unavailable`);
          return;
        }

        // Check if adding from different restaurant
        if (restaurant && restaurant.id !== menuItem.restaurantId) {
          if (items.length > 0) {
            const confirmed = window.confirm(
              'Adding items from a different restaurant will clear your current cart. Continue?'
            );
            if (!confirmed) return;

            // Clear cart and set new restaurant
            set({
              items: [],
              restaurant: null,
              deliveryAddress: null,
            });
          }
        }

        // Set restaurant if not set
        if (!restaurant) {
          // In a real app, you'd fetch restaurant details
          set({ restaurant: { id: menuItem.restaurantId } as Restaurant });
        }

        // Check if item already exists in cart
        const existingItemIndex = items.findIndex(
          (item) => item.menuItemId === menuItem.id
        );

        if (existingItemIndex !== -1) {
          // Update existing item
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            specialInstructions: specialInstructions || updatedItems[existingItemIndex].specialInstructions,
          };
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            menuItemId: menuItem.id,
            quantity,
            specialInstructions,
            menuItem,
          };
          set({ items: [...items, newItem] });
        }

        toast.success(`${quantity} x ${menuItem.name} added to cart`);
      },

      removeItem: (menuItemId: string) => {
        const { items } = get();
        const itemToRemove = items.find((item) => item.menuItemId === menuItemId);

        if (itemToRemove) {
          const updatedItems = items.filter((item) => item.menuItemId !== menuItemId);
          set({ items: updatedItems });

          // Clear restaurant if cart is empty
          if (updatedItems.length === 0) {
            set({
              restaurant: null,
              deliveryAddress: null,
            });
          }

          toast.success(`${itemToRemove.menuItem.name} removed from cart`);
        }
      },

      updateItemQuantity: (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        const { items } = get();
        const updatedItems = items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        );

        set({ items: updatedItems });
      },

      updateItemInstructions: (menuItemId: string, specialInstructions: string) => {
        const { items } = get();
        const updatedItems = items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, specialInstructions } : item
        );

        set({ items: updatedItems });
      },

      clearCart: () => {
        set({
          items: [],
          restaurant: null,
          deliveryAddress: null,
          specialInstructions: '',
        });
      },

      setRestaurant: (restaurant: Restaurant) => {
        const { items } = get();

        if (items.length > 0) {
          const confirmed = window.confirm(
            'Changing restaurant will clear your current cart. Continue?'
          );
          if (!confirmed) return;
        }

        set({
          restaurant,
          items: [],
          deliveryAddress: null,
          specialInstructions: '',
        });
      },

      setDeliveryAddress: (address: Address) => {
        set({ deliveryAddress: address });
      },

      setSpecialInstructions: (instructions: string) => {
        set({ specialInstructions: instructions });
      },

      isRestaurantAvailable: () => {
        const { restaurant } = get();
        return restaurant?.isActive && restaurant?.isAvailableNow || false;
      },
    }),
    {
      name: 'foodeez-cart-storage',
      partialize: (state) => ({
        items: state.items,
        restaurant: state.restaurant,
        deliveryAddress: state.deliveryAddress,
        specialInstructions: state.specialInstructions,
      }),
    }
  )
);

// Utility functions for cart operations
export const cartUtils = {
  // Check if cart meets minimum order requirements
  meetsMinimumOrder: (cart: CartState): boolean => {
    if (!cart.restaurant) return false;
    return cart.subtotal >= cart.restaurant.minimumOrderAmount;
  },

  // Get minimum order amount shortfall
  getMinimumOrderShortfall: (cart: CartState): number => {
    if (!cart.restaurant) return 0;
    const shortfall = cart.restaurant.minimumOrderAmount - cart.subtotal;
    return Math.max(0, shortfall);
  },

  // Get formatted price
  formatPrice: (price: number): string => {
    return `Rs. ${price.toFixed(2)}`;
  },

  // Check if delivery address is set
  hasDeliveryAddress: (cart: CartState): boolean => {
    return cart.deliveryAddress !== null;
  },

  // Prepare order data for API
  prepareOrderData: (cart: CartState) => {
    if (!cart.restaurant || !cart.deliveryAddress) {
      throw new Error('Restaurant and delivery address are required');
    }

    return {
      restaurantId: cart.restaurant.id,
      items: cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddressId: cart.deliveryAddress.id,
      specialInstructions: cart.specialInstructions || undefined,
    };
  },

  // Validate cart before checkout
  validateCart: (cart: CartState): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!cart.restaurant) {
      errors.push('Please select a restaurant');
    }

    if (cart.items.length === 0) {
      errors.push('Your cart is empty');
    }

    if (!cartUtils.meetsMinimumOrder(cart)) {
      const shortfall = cartUtils.getMinimumOrderShortfall(cart);
      errors.push(`Minimum order amount not met. Add Rs. ${shortfall.toFixed(2)} more`);
    }

    if (!cart.deliveryAddress) {
      errors.push('Please add a delivery address');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};