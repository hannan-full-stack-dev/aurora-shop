import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { flyToCart } from '../fly';

const StoreContext = createContext(null);
const STORAGE_KEY = 'aurora-store-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { cart: [], wishlist: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, qty } = action;
      const max = product.stock > 0 ? product.stock : 99;
      const existing = state.cart.find((i) => i.id === product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, max) } : i
          ),
        };
      }
      const item = {
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        brand: product.brand || '',
        stock: max,
        qty: Math.min(qty, max),
      };
      return { ...state, cart: [...state.cart, item] };
    }
    case 'SET_QTY':
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.id ? { ...i, qty: Math.max(1, Math.min(action.qty, i.stock)) } : i
        ),
      };
    case 'REMOVE':
      return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };
    case 'CLEAR':
      return { ...state, cart: [] };
    case 'TOGGLE_WISH':
      return {
        ...state,
        wishlist: state.wishlist.includes(action.id)
          ? state.wishlist.filter((x) => x !== action.id)
          : [...state.wishlist, action.id],
      };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  const notify = useCallback((message) => {
    setToast({ message, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addToCart = useCallback(
    (product, qty = 1, { open = false, from = null } = {}) => {
      dispatch({ type: 'ADD', product, qty });
      flyToCart(from);
      notify(`Added “${product.title}” to your cart`);
      if (open) setCartOpen(true);
    },
    [notify]
  );

  const toggleWishlist = useCallback(
    (product) => {
      const wished = state.wishlist.includes(product.id);
      dispatch({ type: 'TOGGLE_WISH', id: product.id });
      notify(wished ? 'Removed from wishlist' : 'Saved to wishlist');
    },
    [state.wishlist, notify]
  );

  const value = useMemo(() => {
    const count = state.cart.reduce((n, i) => n + i.qty, 0);
    const subtotal = +state.cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    return {
      cart: state.cart,
      wishlist: state.wishlist,
      count,
      subtotal,
      cartOpen,
      toast,
      notify,
      addToCart,
      toggleWishlist,
      isWished: (id) => state.wishlist.includes(id),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', id, qty }),
      removeFromCart: (id) => dispatch({ type: 'REMOVE', id }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    };
  }, [state, cartOpen, toast, notify, addToCart, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
