import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PartProduct } from '../components/dashboard/PartProductCard';
import type { VehicleBasicInfo } from '../services/api';

export interface CartItem {
  product: PartProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  quantities: Record<string, number>;
  count: number;
  addItem: (product: PartProduct, quantity?: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clear: () => void;
  removeWhere: (predicate: (item: CartItem) => boolean) => void;
  vehicle: VehicleBasicInfo | null;
  setVehicle: (vehicle: VehicleBasicInfo | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vehicle, setVehicle] = useState<VehicleBasicInfo | null>(null);

  const addItem = useCallback((product: PartProduct, quantity = 1) => {
    setItems(prev =>
      prev.some(i => i.product.id === product.id)
        ? prev.map(i => (i.product.id === product.id ? { ...i, quantity } : i))
        : [...prev, { product, quantity }],
    );
  }, []);

  const increment = useCallback((productId: string) => {
    setItems(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  }, []);

  const decrement = useCallback((productId: string) => {
    setItems(prev =>
      prev
        .map(i =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter(i => i.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const removeWhere = useCallback(
    (predicate: (item: CartItem) => boolean) =>
      setItems(prev => prev.filter(i => !predicate(i))),
    [],
  );

  const value = useMemo<CartContextValue>(() => {
    const quantities: Record<string, number> = {};
    let count = 0;
    items.forEach(i => {
      quantities[i.product.id] = i.quantity;
      count += i.quantity;
    });
    return {
      items,
      quantities,
      count,
      addItem,
      increment,
      decrement,
      clear,
      removeWhere,
      vehicle,
      setVehicle,
    };
  }, [items, vehicle, addItem, increment, decrement, clear, removeWhere]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
