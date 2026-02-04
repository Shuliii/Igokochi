import {BrowserRouter, Routes, Route} from "react-router-dom";
import {CartProvider} from "./cart/CartContext";

import CustomerPage from "./pages/CustomerPage";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./admin/AdminLogin";
import RequireAuth from "./admin/RequireAuth";

import "./App.css";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
