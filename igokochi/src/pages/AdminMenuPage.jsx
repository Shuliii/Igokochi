import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AdminMain from "../components/admin/AdminMain";
import MenuList from "../components/admin/MenuList";
import { apiGet, apiPatch, forceLogout } from "../admin/api";
import styles from "./AdminPage.module.css";

export default function AdminMenuPage() {
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netError, setNetError] = useState(false);

  const onLogout = () => {
    forceLogout();
    navigate("/admin/login", {
      replace: true,
      state: { reason: "logged_out" },
    });
  };

  const fetchMenu = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const data = await apiGet("/menu");
      setMenu(data.menu || []);
      setNetError(false);
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {
          replace: true,
          state: { reason: "expired" },
        });
        return;
      }

      console.error("Failed to fetch menu", err);
      setNetError(true);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggle = async (item) => {
    const current = item.available !== false;
    const next = !current;

    // optimistic UI
    setMenu((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, available: next } : m)),
    );

    try {
      await apiPatch(`/menu/${item.id}`, {
        available: next,
      });

      setNetError(false);
    } catch (err) {
      if (err?.code === "SESSION_EXPIRED") {
        navigate("/admin/login", {
          replace: true,
          state: { reason: "expired" },
        });
        return;
      }

      console.error("Failed to update menu availability", err);
      setNetError(true);

      // rollback if API fails
      setMenu((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, available: current } : m)),
      );
    }
  };

  return (
    <>
      <AdminHeader
        onRefresh={fetchMenu}
        refreshing={refreshing}
        onLogout={onLogout}
      />

      {netError && (
        <div className={styles.netError}>Connection issue. Retrying…</div>
      )}

      <AdminMain>
        <MenuList menu={menu} onToggle={handleToggle} loading={loading} />
      </AdminMain>
    </>
  );
}
