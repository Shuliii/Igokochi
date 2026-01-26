// src/pages/AdminPage.jsx
import {useEffect, useState} from "react";
import AdminHeader from "../components/admin/AdminHeader";
import {API_BASE_URL} from "../config";

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const data = await res.json();
      console.log(data);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // initial load
  }, []);

  return (
    <>
      <AdminHeader onRefresh={fetchOrders} refreshing={refreshing} />

      <main style={{padding: 16}}>
        {orders.length === 0 ? (
          <p>No orders yet</p>
        ) : (
          orders.map((o) => <pre key={o.id}>{JSON.stringify(o, null, 2)}</pre>)
        )}
      </main>
    </>
  );
};

export default AdminPage;
