import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsFromStorage) setProducts(JSON.parse(productsFromStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      setProducts([...(products ?? []), { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productToIncrement = products.find(product => product.id === id);

      if (productToIncrement) {
        setProducts([
          ...products.filter(product => product.id !== id),
          { ...productToIncrement, quantity: productToIncrement.quantity + 1 },
        ]);
        AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productToDecrement = products.find(product => product.id === id);

      if (productToDecrement) {
        if (productToDecrement.quantity - 1 <= 0) {
          setProducts([...products.filter(product => product.id !== id)]);
        } else {
          setProducts([
            ...products.filter(product => product.id !== id),
            {
              ...productToDecrement,
              quantity: productToDecrement.quantity - 1,
            },
          ]);
        }

        AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
