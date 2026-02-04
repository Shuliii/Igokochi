import {useEffect, useMemo, useState} from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import OrderList from "../components/admin/OrderList";
import OrderTabs from "../components/admin/OrderTabs";
import {apiGet, apiPatch} from "../admin/api";

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

// mysql date may come as ISO string, normalize:
function orderPickupYmd(order) {
  const raw = String(order.pickup_date || "");
  if (raw.length >= 10) return raw.slice(0, 10);
  const d = new Date(order.pickup_date);
  return toYmdLocal(d);
}

function normalizeStatus(s) {
  return String(s || "new").toLowerCase();
}

function countByTab(list, todayYmd) {
  let today = 0;
  let ready = 0;
  let upcoming = 0;

  for (const o of list) {
    const ymd = orderPickupYmd(o);
    const status = normalizeStatus(o.status);

    if (ymd === todayYmd && (status === "new" || status === "paid")) today++;
    else if (ymd === todayYmd && (status === "ready" || status === "done"))
      ready++;
    else if (ymd > todayYmd) upcoming++;
  }

  return {today, ready, upcoming};
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("today"); // today | ready | upcoming

  const today = useMemo(() => getTodayMidnight(), []);
  const todayYmd = useMemo(() => toYmdLocal(today), [today]);

  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const data = await apiGet("/api/orders");
      const list = data.orders || [];
      setOrders(list);

      // smart default tab
      const c = countByTab(list, todayYmd);
      if (c.today > 0) setTab("today");
      else if (c.ready > 0) setTab("ready");
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
    () => countByTab(orders, todayYmd),
    [orders, todayYmd],
  );

  const setOrderStatus = async (id, status) => {
    const nextStatus = normalizeStatus(status);

    // optimistic update first (instant move between tabs)
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? {...o, status: nextStatus} : o)),
    );

    try {
      await apiPatch(`/orders/${id}/status`, {status: nextStatus});
    } catch (err) {
      console.error("Failed to set status", err);
      // rollback: refetch for correctness
      fetchOrders();
    }
  };

  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      const ymd = orderPickupYmd(o);
      const status = normalizeStatus(o.status);

      if (tab === "today")
        return ymd === todayYmd && (status === "new" || status === "paid");
      if (tab === "ready")
        return ymd === todayYmd && (status === "ready" || status === "done");
      // upcoming
      return ymd > todayYmd;
    });

    // Sort inside READY tab: ready first then done
    if (tab === "ready") {
      const rank = {ready: 0, done: 1};
      list.sort((a, b) => {
        const as = normalizeStatus(a.status);
        const bs = normalizeStatus(b.status);
        return (rank[as] ?? 99) - (rank[bs] ?? 99);
      });
    }

    // Upcoming: sort by pickup_date ascending
    if (tab === "upcoming") {
      list.sort((a, b) => orderPickupYmd(a).localeCompare(orderPickupYmd(b)));
    }

    return list;
  }, [orders, tab, todayYmd]);

  return (
    <>
      <AdminHeader onRefresh={fetchOrders} refreshing={refreshing} />
      <AdminMain>
        <OrderTabs value={tab} counts={counts} onChange={setTab} />
        <OrderList
          orders={filteredOrders}
          tab={tab}
          onSetStatus={setOrderStatus}
        />
      </AdminMain>
    </>
  );
}
