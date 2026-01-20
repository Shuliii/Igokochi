import { CartProvider } from "./cart/CartContext";

import Header from "./components/Header";
import Main from "./components/Main";

import "./App.css";

function App() {
  return (
    <CartProvider>
      <Header />
      <Main />
    </CartProvider>
  );
}

export default App;
