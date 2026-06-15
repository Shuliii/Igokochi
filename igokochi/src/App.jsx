import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./cart/CartContext";

import CustomerPage from "./pages/CustomerPage";
import AdminPage from "./pages/AdminPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminSchedulePage from "./pages/AdminSchedulePage";
import AdminReportsPage from "./pages/AdminReportsPage";
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
          <Route
            path="/admin/menu"
            element={
              <RequireAuth>
                <AdminMenuPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <RequireAuth>
                <AdminSchedulePage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAuth>
                <AdminReportsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
