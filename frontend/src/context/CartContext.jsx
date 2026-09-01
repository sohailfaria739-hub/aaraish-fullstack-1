import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await client.get('/cart');
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (product_id, quantity = 1, size = '', color = '') => {
    const res = await client.post('/cart', { product_id, quantity, size, color });
    setItems(res.data.items);
  };

  const updateQuantity = async (id, quantity) => {
    const res = await client.put(`/cart/${id}`, { quantity });
    setItems(res.data.items);
  };

  const removeItem = async (id) => {
    const res = await client.delete(`/cart/${id}`);
    setItems(res.data.items);
  };

  const clearCart = async () => {
    await client.delete('/cart');
    setItems([]);
  };

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, count, total, addToCart, updateQuantity, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
