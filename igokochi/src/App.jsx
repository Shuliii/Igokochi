import {BrowserRouter, Routes, Route} from "react-router-dom";
import {CartProvider} from "./cart/CartContext";
import CustomerPage from "./pages/CustomerPage";
import AdminPage from "./pages/AdminPage";

import "./App.css";

function App() {
  return (
    <CartProvider>
      <BrowserRouter basename="/Igokochi">
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
