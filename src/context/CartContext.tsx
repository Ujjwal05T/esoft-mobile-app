import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import type { PartProduct } from '../components/dashboard/PartProductCard';
import { toPartProduct } from '../components/catalog/catalogMapping';
import AppAlert from '../components/overlays/AppAlert';
import {
  clearCart,
  getCart,
  removeCartItem,
  setCartItem,
  type CartDto,
  type VehicleBasicInfo,
} from '../services/api';

export interface CartItem {
  product: PartProduct;
  quantity: number;
  // Set by the server: the part was deactivated or deleted after it was added
  unavailable?: boolean;
  // Set by the server: more than what is in stock now
  exceedsStock?: boolean;
  // Units in stock right now
  stock?: number;
  // Who added the part to the shared cart (name from the server)
  addedBy?: string;
  // Who changed it last
  updatedBy?: string;
}

interface CartContextValue {
  items: CartItem[];
  quantities: Record<string, number>;
  count: number;
  // True until the first load of the shared cart finishes
  loading: boolean;
  addItem: (product: PartProduct, quantity?: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clear: () => void;
  removeWhere: (predicate: (item: CartItem) => boolean) => void;
  // Re-reads the shared cart (teammates may have changed it)
  refresh: () => Promise<void>;
  vehicle: VehicleBasicInfo | null;
  setVehicle: (vehicle: VehicleBasicInfo | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function fromServer(cart: CartDto): CartItem[] {
  return cart.lines
    .filter(l => l.item)
    .map(l => ({
      product: toPartProduct(l.item!),
      quantity: l.quantity,
      unavailable: !l.isAvailable,
      exceedsStock: l.exceedsStock,
      stock: l.item!.stock,
      addedBy: l.addedByName ?? undefined,
      updatedBy: l.updatedByName ?? undefined,
    }));
}

// The cart lives on the server and is shared by the whole workshop (owner and staff).
// Changes show immediately here, then are sent one at a time; when the last one
// finishes the server's cart replaces the local copy.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleBasicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemsRef = useRef<CartItem[]>([]);
  const pending = useRef(0);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const replaceItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const refresh = useCallback(async () => {
    // Don't overwrite changes that haven't reached the server yet
    if (pending.current > 0) return;
    const res = await getCart();
    if (res.success && res.data && pending.current === 0) {
      replaceItems(fromServer(res.data));
    }
    setLoading(false);
  }, [replaceItems]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const enqueue = useCallback(
    (
      send: () => Promise<{ success: boolean; data?: CartDto; error?: string }>,
    ) => {
      pending.current += 1;
      chain.current = chain.current.then(async () => {
        const res = await send();
        pending.current -= 1;
        if (!res.success) setError(res.error ?? 'Could not update the cart.');
        if (pending.current > 0) return;
        if (res.success && res.data) {
          replaceItems(fromServer(res.data));
          return;
        }
        // The last change failed: fall back to what the server really has
        const latest = await getCart();
        if (latest.success && latest.data && pending.current === 0) {
          replaceItems(fromServer(latest.data));
        }
      });
    },
    [replaceItems],
  );

  const setQuantity = useCallback(
    (product: PartProduct, quantity: number) => {
      const current = itemsRef.current;
      const exists = current.some(i => i.product.id === product.id);
      let next: CartItem[];
      if (quantity <= 0) {
        next = current.filter(i => i.product.id !== product.id);
      } else if (exists) {
        next = current.map(i =>
          i.product.id === product.id ? { ...i, quantity } : i,
        );
      } else {
        next = [...current, { product, quantity }];
      }
      replaceItems(next);
      enqueue(() => setCartItem(Number(product.id), quantity));
    },
    [enqueue, replaceItems],
  );

  const addItem = useCallback(
    (product: PartProduct, quantity = 1) => setQuantity(product, quantity),
    [setQuantity],
  );

  const increment = useCallback(
    (productId: string) => {
      const line = itemsRef.current.find(i => i.product.id === productId);
      if (line) setQuantity(line.product, line.quantity + 1);
    },
    [setQuantity],
  );

  const decrement = useCallback(
    (productId: string) => {
      const line = itemsRef.current.find(i => i.product.id === productId);
      if (line) setQuantity(line.product, line.quantity - 1);
    },
    [setQuantity],
  );

  const clear = useCallback(() => {
    replaceItems([]);
    enqueue(() => clearCart());
  }, [enqueue, replaceItems]);

  const removeWhere = useCallback(
    (predicate: (item: CartItem) => boolean) => {
      const removed = itemsRef.current.filter(predicate);
      if (removed.length === 0) return;
      replaceItems(itemsRef.current.filter(i => !predicate(i)));
      removed.forEach(i => enqueue(() => removeCartItem(Number(i.product.id))));
    },
    [enqueue, replaceItems],
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
      loading,
      addItem,
      increment,
      decrement,
      clear,
      removeWhere,
      refresh,
      vehicle,
      setVehicle,
    };
  }, [
    items,
    loading,
    vehicle,
    addItem,
    increment,
    decrement,
    clear,
    removeWhere,
    refresh,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <AppAlert
        isOpen={!!error}
        type="info"
        message={error ?? ''}
        onClose={() => setError(null)}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
