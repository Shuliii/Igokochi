import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import OrderList from "../components/admin/OrderList";
import OrderTabs from "../components/admin/OrderTabs";
import { API_BASE_URL } from "../config";

// --- Helpers ---
function toYmdLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// pickup_date from MySQL often comes as ISO string. Normalize to local YMD.
function orderPickupYmd(order) {
  // if backend sends "YYYY-MM-DD", new Date("YYYY-MM-DD") can become UTC-shifted.
  // safest: take first 10 chars if it looks like ISO/DATE.
  const raw = String(order.pickup_date || "");
  if (raw.length >= 10) return raw.slice(0, 10);

  // fallback
  const d = new Date(order.pickup_date);
  return toYmdLocal(d);
}

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState("today"); // "today" | "tomorrow" | "upcoming"

  const today = useMemo(() => getTodayMidnight(), []);
  const todayYmd = useMemo(() => toYmdLocal(today), [today]);

  const tomorrowYmd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toYmdLocal(d);
  }, [today]);

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const data = await res.json();
      const list = data.orders || [];
      setOrders(list);

      // smart default tab
      const counts = countByTab(list, todayYmd, tomorrowYmd);
      if (counts.today > 0) setTab("today");
      else if (counts.tomorrow > 0) setTab("tomorrow");
      else setTab("upcoming");
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setOrders([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => countByTab(orders, todayYmd, tomorrowYmd),
    [orders, todayYmd, tomorrowYmd],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const ymd = orderPickupYmd(o);

      if (tab === "today") return ymd === todayYmd;
      if (tab === "tomorrow") return ymd === tomorrowYmd;
      // upcoming
      return ymd > tomorrowYmd;
    });
  }, [orders, tab, todayYmd, tomorrowYmd]);

  const setOrderStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      // optimistic UI: update locally
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    } catch (err) {
      console.error("Failed to set status", err);
    }
  };

  return (
    <>
      <AdminHeader onRefresh={fetchOrders} refreshing={refreshing} />

      <AdminMain>
        <OrderTabs value={tab} counts={counts} onChange={setTab} />
        <OrderList orders={filteredOrders} onSetStatus={setOrderStatus} />
      </AdminMain>
    </>
  );
};

export default AdminPage;

// --- small helper for counts ---
function countByTab(list, todayYmd, tomorrowYmd) {
  let today = 0;
  let tomorrow = 0;
  let upcoming = 0;

  for (const o of list) {
    const ymd = orderPickupYmd(o);
    if (ymd === todayYmd) today++;
    else if (ymd === tomorrowYmd) tomorrow++;
    else if (ymd > tomorrowYmd) upcoming++;
  }

  return { today, tomorrow, upcoming };
}
