import { createContext, useContext, useReducer, useEffect } from "react";
import { cartReducer, initialCartState } from "./CartReducer";

const CartContext = createContext(null);

const STORAGE_KEY = "igokochi-cart";
const MAX_CART_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

const getInitialState = () => {
  try {
    if (typeof window === "undefined") return initialCartState;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialCartState;

    const { state, savedAt } = JSON.parse(raw);

    if (!state || !savedAt || Date.now() - savedAt > MAX_CART_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return initialCartState;
    }

    return state;
  } catch {
    return initialCartState;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState);

  useEffect(() => {
    if (state.items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const savedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, savedAt }));

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_CART" });
    }, MAX_CART_AGE_MS);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
