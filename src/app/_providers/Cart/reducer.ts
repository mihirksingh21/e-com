import type { CartItems, Product, User } from '../../../payload/payload-types';

export type CartItem = CartItems[0] & {
  product: string | Product;
  quantity: number;
  id: string;
  price?: number; // Existing property
  priceInINR?: string; // Add this line
};

type CartType = User['cart'];

type CartAction =
  | {
      type: 'SET_CART';
      payload: CartType;
    }
  | {
      type: 'MERGE_CART';
      payload: CartType;
    }
  | {
      type: 'ADD_ITEM';
      payload: CartItem;
    }
  | {
      type: 'DELETE_ITEM';
      payload: Product;
    }
  | {
      type: 'CLEAR_CART';
    };

const USD_TO_INR_CONVERSION_RATE = 83.00; // Example conversion rate

export const cartReducer = (cart: CartType, action: CartAction): CartType => {
  switch (action.type) {
    case 'SET_CART': {
      return action.payload;
    }

    case 'MERGE_CART': {
      const { payload: incomingCart } = action;

      const syncedItems: CartItem[] = [
        ...(cart?.items || []),
        ...(incomingCart?.items || []),
      ].reduce((acc: CartItem[], item) => {
        const productId = typeof item.product === 'string' ? item.product : item?.product?.id;

        const indexInAcc = acc.findIndex(({ product }) =>
          typeof product === 'string' ? product === productId : product?.id === productId,
        );

        if (indexInAcc > -1) {
          acc[indexInAcc] = {
            ...acc[indexInAcc],
            // Convert price from USD to INR
            priceInINR: (acc[indexInAcc].price * USD_TO_INR_CONVERSION_RATE).toFixed(2),
          };
        } else {
          acc.push({
            ...item,
            // Convert price from USD to INR
            priceInINR: (item.price * USD_TO_INR_CONVERSION_RATE).toFixed(2),
          });
        }
        return acc;
      }, []);

      return {
        ...cart,
        items: syncedItems,
      };
    }

    case 'ADD_ITEM': {
      const { payload: incomingItem } = action;
      const productId =
        typeof incomingItem.product === 'string' ? incomingItem.product : incomingItem?.product?.id;

      const indexInCart = cart?.items?.findIndex(({ product }) =>
        typeof product === 'string' ? product === productId : product?.id === productId,
      );

      let withAddedItem = [...(cart?.items || [])];

      if (indexInCart === -1) {
        withAddedItem.push({
          ...incomingItem,
          // Convert price from USD to INR
          priceInINR: (incomingItem.price * USD_TO_INR_CONVERSION_RATE).toFixed(2),
        });
      }

      if (typeof indexInCart === 'number' && indexInCart > -1) {
        withAddedItem[indexInCart] = {
          ...withAddedItem[indexInCart],
          quantity: (incomingItem.quantity || 0) > 0 ? incomingItem.quantity : undefined,
          // Update price in INR if needed
          priceInINR: (withAddedItem[indexInCart].price * USD_TO_INR_CONVERSION_RATE).toFixed(2),
        };
      }

      return {
        ...cart,
        items: withAddedItem,
      };
    }

    case 'DELETE_ITEM': {
      const { payload: incomingProduct } = action;
      const withDeletedItem = { ...cart };

      const indexInCart = cart?.items?.findIndex(({ product }) =>
        typeof product === 'string'
          ? product === incomingProduct.id
          : product?.id === incomingProduct.id,
      );

      if (typeof indexInCart === 'number' && withDeletedItem.items && indexInCart > -1)
        withDeletedItem.items.splice(indexInCart, 1);

      return withDeletedItem;
    }

    case 'CLEAR_CART': {
      return {
        ...cart,
        items: [],
      };
    }

    default: {
      return cart;
    }
  }
};