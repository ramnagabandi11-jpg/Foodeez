import { useContext, createContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { Cart, CartItem, Restaurant } from '@/types';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurant: Restaurant) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodeez-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        localStorage.removeItem('foodeez-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem('foodeez-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('foodeez-cart');
    }
  }, [cart]);

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      if (!prevCart) {
        return {
          items: [item],
          restaurantId: item.menuItem.restaurantId || '',
          restaurant: {} as Restaurant,
          subtotal: item.subtotal,
          deliveryFee: 0,
          platformFee: 0,
          taxes: 0,
          totalAmount: item.subtotal,
          minimumOrder: 0,
        };
      }

      // Check if the item is from the same restaurant
      if (prevCart.restaurantId && item.menuItem.restaurantId !== prevCart.restaurantId) {
        toast.error('You can only add items from one restaurant at a time');
        return prevCart;
      }

      const existingItemIndex = prevCart.items.findIndex(
        (cartItem) => cartItem.menuItemId === item.menuItemId
      );

      let newItems: CartItem[];
      let newSubtotal: number;

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = prevCart.items.map((cartItem, index) => {
          if (index === existingItemIndex) {
            return {
              ...cartItem,
              quantity: cartItem.quantity + item.quantity,
              subtotal: cartItem.subtotal + item.subtotal,
            };
          }
          return cartItem;
        });
        newSubtotal = prevCart.subtotal + item.subtotal;
      } else {
        // Add new item
        newItems = [...prevCart.items, item];
        newSubtotal = prevCart.subtotal + item.subtotal;
      }

      // Calculate totals
      const deliveryFee = prevCart.deliveryFee;
      const platformFee = Math.round(newSubtotal * 0.05 * 100) / 100; // 5% platform fee
      const taxes = Math.round((newSubtotal + deliveryFee) * 0.05 * 100) / 100; // 5% GST
      const totalAmount = newSubtotal + deliveryFee + platformFee + taxes;

      const newCart: Cart = {
        ...prevCart,
        items: newItems,
        subtotal: newSubtotal,
        platformFee,
        taxes,
        totalAmount,
      };

      toast.success('Item added to cart');
      return newCart;
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prevCart) => {
      if (!prevCart) return null;

      const newItems = prevCart.items.filter((item) => item.menuItemId !== menuItemId);

      if (newItems.length === 0) {
        toast.success('Item removed from cart');
        return null;
      }

      const itemToRemove = prevCart.items.find((item) => item.menuItemId === menuItemId);
      const newSubtotal = prevCart.subtotal - (itemToRemove?.subtotal || 0);

      // Recalculate totals
      const deliveryFee = prevCart.deliveryFee;
      const platformFee = Math.round(newSubtotal * 0.05 * 100) / 100;
      const taxes = Math.round((newSubtotal + deliveryFee) * 0.05 * 100) / 100;
      const totalAmount = newSubtotal + deliveryFee + platformFee + taxes;

      const newCart: Cart = {
        ...prevCart,
        items: newItems,
        subtotal: newSubtotal,
        platformFee,
        taxes,
        totalAmount,
      };

      toast.success('Item removed from cart');
      return newCart;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setCart((prevCart) => {
      if (!prevCart) return null;

      const newItems = prevCart.items.map((item) => {
        if (item.menuItemId === menuItemId) {
          const newSubtotal = (item.subtotal / item.quantity) * quantity;
          return {
            ...item,
            quantity,
            subtotal: newSubtotal,
          };
        }
        return item;
      });

      const itemToUpdate = prevCart.items.find((item) => item.menuItemId === menuItemId);
      const oldSubtotal = itemToUpdate?.subtotal || 0;
      const newSubtotal = prevCart.subtotal - oldSubtotal + ((oldSubtotal / itemToUpdate!.quantity) * quantity);

      // Recalculate totals
      const deliveryFee = prevCart.deliveryFee;
      const platformFee = Math.round(newSubtotal * 0.05 * 100) / 100;
      const taxes = Math.round((newSubtotal + deliveryFee) * 0.05 * 100) / 100;
      const totalAmount = newSubtotal + deliveryFee + platformFee + taxes;

      return {
        ...prevCart,
        items: newItems,
        subtotal: newSubtotal,
        platformFee,
        taxes,
        totalAmount,
      };
    });
  };

  const clearCart = () => {
    setCart(null);
    toast.success('Cart cleared');
  };

  const setRestaurant = (restaurant: Restaurant) => {
    setCart((prevCart) => {
      return {
        items: prevCart?.items || [],
        restaurantId: restaurant.id,
        restaurant,
        subtotal: prevCart?.subtotal || 0,
        deliveryFee: restaurant.deliveryFee,
        platformFee: prevCart?.platformFee || 0,
        taxes: prevCart?.taxes || 0,
        totalAmount: prevCart?.totalAmount || 0,
        minimumOrder: restaurant.minimumOrder,
      };
    });
  };

  const value: CartContextType = {
    cart,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setRestaurant,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}