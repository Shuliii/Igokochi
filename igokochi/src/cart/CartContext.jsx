import { createContext, useContext, useReducer, useEffect } from "react";
import { cartReducer, initialCartState } from "./CartReducer";

const CartContext = createContext(null);

const STORAGE_KEY = "igokochi-cart";

const getInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialCartState;
  } catch {
    return initialCartState;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
