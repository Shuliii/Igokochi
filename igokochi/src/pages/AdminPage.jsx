import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import OrderList from "../components/admin/OrderList";
import OrderTabs from "../components/admin/OrderTabs";
import WalkInModal from "../components/admin/WalkInModal";
import { apiGet, apiPatch, forceLogout } from "../admin/api";
import { toYmd, getTodayMidnight } from "../utils/pickup";
import styles from "./AdminPage.module.css";

// mysql date may come as ISO string, normalize:
function orderPickupYmd(order) {
  const raw = String(order.pickup_date || "");
  if (raw.length >= 10) return raw.slice(0, 10);
  const d = new Date(order.pickup_date);
  return toYmd(d);
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

  return { today, ready, upcoming };
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("today"); // today | ready | upcoming
  const [netError, setNetError] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const navigate = useNavigate();

  const today = useMemo(() => getTodayMidnight(), []);
  const todayYmd = useMemo(() => toYmd(today), [today]);

  const onLogout = () => {
    forceLogout();
    navigate("/admin/login", {
      replace: true,
      state: { reason: "logged_out" },
    });
  };

  // Initial fetch: also choose smart default tab (only once)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setRefreshing(true);
      try {
        const data = await apiGet("/orders");
        const list = data.orders || [];
        if (cancelled) return;

        setOrders(list);
        setNetError(false);

        // smart default tab only on first load
        const c = countByTab(list, todayYmd);
        if (c.today > 0) setTab("today");
        else if (c.ready > 0) setTab("ready");
        else setTab("upcoming");
      } catch (err) {
        if (err?.code === "SESSION_EXPIRED") {
          navigate("/admin/login", {
            replace: true,
            state: { reason: "expired" },
          });
          return;
        }

        console.error("Failed to fetch orders", err);
        if (!cancelled) setNetError(true);
      } finally {
        if (!cancelled) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, todayYmd]);

  // Normal refresh (manual + auto): do NOT auto-switch tabs
  const fetchOrders = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const data = await apiGet("/orders");
      setOrders(data.orders || []);
      setNetError(false); // connection recovered
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {
          replace: true,
          state: { reason: "expired" },
        });
        return;
      }

      console.error("Failed to fetch orders", err);
      setNetError(true);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, navigate]);

  // Auto refresh every 10 seconds
  useEffect(() => {
    const id = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(id);
  }, [fetchOrders]);

  const counts = useMemo(
    () => countByTab(orders, todayYmd),
    [orders, todayYmd],
  );

  const setOrderStatus = async (id, status) => {
    const nextStatus = normalizeStatus(status);

    // optimistic update first (instant move between tabs)
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
    );

    try {
      await apiPatch(`/orders/${id}/status`, { status: nextStatus });
      setNetError(false);
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {
          replace: true,
          state: { reason: "expired" },
        });
        return;
      }

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

    const byDateTime = (a, b) => {
      const dateCmp = orderPickupYmd(a).localeCompare(orderPickupYmd(b));
      if (dateCmp !== 0) return dateCmp;
      return String(a.pickup_slot || "").localeCompare(String(b.pickup_slot || ""));
    };

    if (tab === "today" || tab === "upcoming") {
      list.sort(byDateTime);
    }

    if (tab === "ready") {
      const rank = { ready: 0, done: 1 };
      list.sort((a, b) => {
        const dateCmp = byDateTime(a, b);
        if (dateCmp !== 0) return dateCmp;
        return (rank[normalizeStatus(a.status)] ?? 99) - (rank[normalizeStatus(b.status)] ?? 99);
      });
    }

    return list;
  }, [orders, tab, todayYmd]);

  return (
    <>
      <AdminHeader
        onRefresh={fetchOrders}
        refreshing={refreshing}
        onLogout={onLogout}
      />

      {netError && (
        <div className={styles.netError}>Connection issue. Retrying…</div>
      )}

      <AdminMain>
        <div className={styles.tabsRow}>
          <OrderTabs value={tab} counts={counts} onChange={setTab} />
          <button
            type="button"
            className={styles.walkInBtn}
            onClick={() => setShowWalkIn(true)}
            aria-label="Add walk-in order"
          >
            <span className={styles.walkInFull}>+ Walk-in</span>
            <span className={styles.walkInShort}>+</span>
          </button>
        </div>
        <OrderList
          orders={filteredOrders}
          tab={tab}
          onSetStatus={setOrderStatus}
          loading={loading}
        />
      </AdminMain>

      {showWalkIn && (
        <WalkInModal
          onClose={() => setShowWalkIn(false)}
          onSuccess={fetchOrders}
        />
      )}
    </>
  );
}
