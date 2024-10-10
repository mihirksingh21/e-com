'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { Product, User } from '../../../payload/payload-types';
import { useAuth } from '../Auth';
import { CartItem, cartReducer } from './reducer';

export type CartContext = {
  cart: User['cart'];
  addItemToCart: (item: CartItem) => void;
  deleteItemFromCart: (product: Product) => void;
  cartIsEmpty: boolean | undefined;
  clearCart: () => void;
  isProductInCart: (product: Product) => boolean;
  cartTotal: {
    formatted: string;
    raw: number;
  };
  hasInitializedCart: boolean;
};

const Context = createContext({} as CartContext);

export const useCart = () => useContext(Context);

const arrayHasItems = (array) => Array.isArray(array) && array.length > 0;

// Conversion rate from USD to INR
const USD_TO_INR_CONVERSION_RATE = 83.00; // Example conversion rate

const flattenCart = (cart: User['cart']): User['cart'] => ({
  ...cart,
  items: cart.items
    .map((item) => {
      if (!item?.product || typeof item?.product !== 'object') {
        return null;
      }

      return {
        ...item,
        // Flatten relationship to product
        product: item?.product?.id,
        quantity: typeof item?.quantity === 'number' ? item?.quantity : 0,
        // Convert price to INR
        priceInINR: (item.product.price * USD_TO_INR_CONVERSION_RATE).toFixed(2), // Assuming price is in USD
      };
    })
    .filter(Boolean) as CartItem[],
});

export const CartProvider = (props) => {
  const { children } = props;
  const { user, status: authStatus } = useAuth();

  const [cart, dispatchCart] = useReducer(cartReducer, {});

  const [total, setTotal] = useState<{
    formatted: string;
    raw: number;
  }>({
    formatted: '0.00',
    raw: 0,
  });

  const hasInitialized = useRef(false);
  const [hasInitializedCart, setHasInitialized] = useState(false);

  // Check local storage for a cart
  useEffect(() => {
    if (user === undefined) return;
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      const syncCartFromLocalStorage = async () => {
        const localCart = localStorage.getItem('cart');
        const parsedCart = JSON.parse(localCart || '{}');

        if (parsedCart?.items && parsedCart?.items.length > 0) {
          const initialCart = await Promise.all(
            parsedCart.items.map(async ({ product, quantity }) => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/api/products/${product}`,
              );
              const data = await res.json();
              return {
                product: data,
                quantity,
              };
            }),
          );

          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: initialCart,
            },
          });
        } else {
          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: [],
            },
          });
        }
      };

      syncCartFromLocalStorage();
    }
  }, [user]);

  // Merge user's cart with local state upon logging in
  useEffect(() => {
    if (!hasInitialized.current) return;

    if (authStatus === 'loggedIn') {
      dispatchCart({
        type: 'MERGE_CART',
        payload: user?.cart,
      });
    }

    if (authStatus === 'loggedOut') {
      dispatchCart({
        type: 'CLEAR_CART',
      });
    }
  }, [user, authStatus]);

   // Sync cart to local storage or Payload based on authentication status
   useEffect(() => {
     if (!hasInitialized.current || user === undefined || !cart.items) return;

     const flattenedCart = flattenCart(cart);

     if (user) {
       if (JSON.stringify(flattenCart(user.cart)) === JSON.stringify(flattenedCart)) {
         setHasInitialized(true);
         return;
       }

       try {
         const syncCartToPayload = async () => {
           const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
             credentials: 'include',
             method: 'PATCH',
             body: JSON.stringify({
               cart: flattenedCart,
             }),
             headers: {
               'Content-Type': 'application/json',
             },
           });

           if (req.ok) {
             localStorage.setItem('cart', '[]');
           }
         };

         syncCartToPayload();
       } catch (e) {
         console.error('Error while syncing cart to Payload.'); // eslint-disable-line no-console
       }
     } else {
       localStorage.setItem('cart', JSON.stringify(flattenedCart));
     }

     setHasInitialized(true);
   }, [user, cart]);

   const isProductInCart = useCallback(
     (incomingProduct: Product): boolean => {
       let isInCart = false;
       const { items: itemsInCart } = cart || {};
       if (Array.isArray(itemsInCart) && itemsInCart.length > 0) {
         isInCart = Boolean(
           itemsInCart.find(({ product }) =>
             typeof product === 'string'
               ? product === incomingProduct.id
               : product?.id === incomingProduct.id,
           ),
         );
       }
       return isInCart;
     },
     [cart],
   );

   // Add new items or update existing ones
   const addItemToCart = useCallback((incomingItem) => {
     dispatchCart({
       type: 'ADD_ITEM',
       payload: incomingItem,
     });
   }, []);

   const deleteItemFromCart = useCallback((incomingProduct: Product) => {
     dispatchCart({
       type: 'DELETE_ITEM',
       payload: incomingProduct,
     });
   }, []);

   const clearCart = useCallback(() => {
     dispatchCart({
       type: 'CLEAR_CART',
     });
   }, []);

   // Calculate the new cart total whenever the cart changes
   useEffect(() => {
     if (!hasInitialized) return;

     const newTotal =
       cart?.items?.reduce((acc, item) => {
         return (
           acc +
           (typeof item.product === 'object'
             ? JSON.parse(item?.product?.priceJSON || '{}')?.data?.[0]?.unit_amount *
               (typeof item?.quantity === 'number' ? item?.quantity : 0)
             : 0)
         );
       }, 0) || 0;

     setTotal({
       formatted: ((newTotal / USD_TO_INR_CONVERSION_RATE)).toLocaleString('en-IN', { 
          style:'currency', 
          currency:'INR' 
        }),
       raw: newTotal,
     });
     
    // Note that total.raw will still be in USD unless you convert it here as well.
     
    }, [cart, hasInitialized]);

    return (
      <Context.Provider
        value={{
          cart,
          addItemToCart,
          deleteItemFromCart,
          cartIsEmpty: hasInitializedCart && !arrayHasItems(cart?.items),
          clearCart,
          isProductInCart,
          cartTotal: total,
          hasInitializedCart,
        }}
      >
        {children}
      </Context.Provider>
    );
};