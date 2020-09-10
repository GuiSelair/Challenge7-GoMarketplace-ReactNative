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
      const productsInStorage = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );
      if (!productsInStorage) return;

      setProducts(JSON.parse(productsInStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {

      const [productIsTheArray] = products.filter(
        item => item.id === product.id,
      );

      if (!productIsTheArray) {
        product.quantity = 1;
        setProducts([...products, product]);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify([...products, product]),
        );
        return;
      }

      productIsTheArray.quantity += 1;
      const productsLessCurrentProduct = products.filter(
        item => item.id !== productIsTheArray.id,
      );
      setProducts([...productsLessCurrentProduct, productIsTheArray]);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const [product] = products.filter(item => item.id === id);

      if (!product) {
        console.log(`>>ERROR: Produto com ID: ${id} não encontrado`);
      }

      product.quantity += 1;
      const productsLessCurrentProduct = products.filter(
        item => item.id !== id,
      );
      setProducts([...productsLessCurrentProduct, product]);
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify([...productsLessCurrentProduct, product]),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const [product] = products.filter(item => item.id === id);
      const productsLessCurrentProduct = products.filter(
        item => item.id !== id,
      );

      if (!product) {
        console.log(`>>ERROR: Produto com ID: ${id} não encontrado`);
      }

      product.quantity -= 1;

      if (product.quantity <= 0) {
        setProducts([...productsLessCurrentProduct]);
        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify([...productsLessCurrentProduct]),
        );
        return;
      }

      setProducts([...productsLessCurrentProduct, product]);
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify([...productsLessCurrentProduct, product]),
      );
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
