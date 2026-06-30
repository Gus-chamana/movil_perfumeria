import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, PRODUCTS_MOCK } from '../assets/productsData';
import { useAuth } from './AuthContext';
import { 
  getCartAPI, 
  addOrUpdateCartItemAPI, 
  removeCartItemAPI, 
  clearCartAPI 
} from '../services/apiService';

export interface CartItem {
  product: Product;
  quantity: number;
  dbItemId?: string; // Guarda el ID de la fila en la BD para eliminarlo directamente
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cargar carrito de la BD al loguearse
  useEffect(() => {
    const loadCart = async () => {
      if (token) {
        try {
          const remoteItems = await getCartAPI(token);
          setCartItems(remoteItems);
        } catch (error) {
          console.warn('Error al cargar carrito remoto, usando mock local:', error);
        }
      } else {
        // Al cerrar sesión, vaciar o mantener mock temporal
        setCartItems([]);
      }
    };
    loadCart();
  }, [token]);

  const addToCart = async (product: Product) => {
    // Si el usuario está logueado, sincroniza con el backend
    if (token && product.varianteId) {
      try {
        const existing = cartItems.find((item) => item.product.id === product.id);
        const qty = existing ? existing.quantity + 1 : 1;
        const updatedItems = await addOrUpdateCartItemAPI(product.varianteId, qty, token);
        setCartItems(updatedItems);
      } catch (error) {
        console.error('Error al agregar al carrito remoto:', error);
      }
    } else {
      // Flujo local sin login
      setCartItems((prevItems) => {
        const existing = prevItems.find((item) => item.product.id === product.id);
        if (existing) {
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevItems, { product, quantity: 1 }];
      });
    }
  };

  const increaseQty = async (id: string) => {
    const item = cartItems.find((i) => i.product.id === id);
    if (!item) return;

    if (token && item.product.varianteId) {
      try {
        const updatedItems = await addOrUpdateCartItemAPI(item.product.varianteId, item.quantity + 1, token);
        setCartItems(updatedItems);
      } catch (error) {
        console.error('Error al incrementar en el carrito remoto:', error);
      }
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    }
  };

  const decreaseQty = async (id: string) => {
    const item = cartItems.find((i) => i.product.id === id);
    if (!item) return;
    
    const nextQty = item.quantity - 1;
    if (nextQty <= 0) return;

    if (token && item.product.varianteId) {
      try {
        const updatedItems = await addOrUpdateCartItemAPI(item.product.varianteId, nextQty, token);
        setCartItems(updatedItems);
      } catch (error) {
        console.error('Error al decrementar en el carrito remoto:', error);
      }
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === id ? { ...item, quantity: nextQty } : item
        )
      );
    }
  };

  const removeItem = async (id: string) => {
    const item = cartItems.find((i) => i.product.id === id);
    if (!item) return;

    if (token && item.dbItemId) {
      try {
        const updatedItems = await removeCartItemAPI(item.dbItemId, token);
        setCartItems(updatedItems);
      } catch (error) {
        console.error('Error al remover del carrito remoto:', error);
      }
    } else {
      setCartItems((prev) => prev.filter((item) => item.product.id !== id));
    }
  };

  const clearCart = async () => {
    if (token) {
      try {
        const updatedItems = await clearCartAPI(token);
        setCartItems(updatedItems);
      } catch (error) {
        console.error('Error al limpiar el carrito remoto:', error);
      }
    } else {
      setCartItems([]);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQty,
        decreaseQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
