import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => boolean;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCharges: number;
  grandTotal: number;
  totalItemsCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeDeliveryThreshold: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LAHORE_DELIVERY_FEE = 250;
const FREE_DELIVERY_THRESHOLD = 5000;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('jg_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('jg_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1): boolean => {
    if (variant.stock <= 0) return false;

    let success = true;
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + quantity;
        if (newQty > variant.stock) {
          success = false;
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          maxStock: variant.stock,
        };
        return updated;
      }

      if (quantity > variant.stock) {
        success = false;
        return prev;
      }

      const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice;
      const newItem: CartItem = {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        productImage: product.images[0] || '',
        color: variant.color,
        size: variant.size,
        unitPrice,
        quantity,
        maxStock: variant.stock,
      };
      return [...prev, newItem];
    });

    if (success) {
      setIsCartOpen(true);
    }
    return success;
  };

  const removeFromCart = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          const finalQty = Math.min(quantity, item.maxStock);
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryCharges = subtotal > 0 && subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : subtotal > 0 ? LAHORE_DELIVERY_FEE : 0;
  const grandTotal = subtotal + deliveryCharges;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryCharges,
        grandTotal,
        totalItemsCount,
        isCartOpen,
        setIsCartOpen,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
