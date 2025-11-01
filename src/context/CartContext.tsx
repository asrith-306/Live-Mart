import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  retailer_id?: string;
  wholesaler_id?: string;
  description?: string;
  image_url?: string;
  deleted_at?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string | undefined) => void;
  updateQuantity: (productId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    console.log('addToCart called with:', product, 'quantity:', quantity);
    
    if (!product.id) {
      console.error('Cannot add product without ID:', product);
      return;
    }
    
    setCartItems(prev => {
      console.log('Previous cart items:', prev);
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        console.log('Item already exists, updating quantity');
        // Update quantity if item exists
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        console.log('Adding new item to cart');
        // Add new item
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string | undefined) => {
    if (!productId) return;
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string | undefined, quantity: number) => {
    if (!productId) return;
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};