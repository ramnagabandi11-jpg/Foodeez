'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { items, setDeliveryAddress } = useCartStore();

  useEffect(() => {
    // Load user's default delivery address if cart is empty and user is authenticated
    // This would typically be done when user logs in
  }, [items, setDeliveryAddress]);

  return <>{children}</>;
}