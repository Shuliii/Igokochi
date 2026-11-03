import styles from "./AdminHeader.module.css";
import { RefreshCw, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminHeader = ({ onRefresh, refreshing, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const isOrders = location.pathname === "/admin";
  const isMenu = location.pathname === "/admin/menu";
  const isSchedule = location.pathname === "/admin/schedule";
  const isReports = location.pathname === "/admin/reports";

  const tabs = [
    { path: "/admin", label: "Orders", active: isOrders },
    { path: "/admin/menu", label: "Menu", active: isMenu },
    { path: "/admin/schedule", label: "Schedule", active: isSchedule },
    { path: "/admin/reports", label: "Reports", active: isReports },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.brand}>
            <img
              src="/assets/Igokochi House Logo Transparent.PNG"
              alt="Igokochi"
              className={styles.logo}
            />
            <span className={styles.title}>Igokochi House</span>
          </div>

          <div className={styles.right}>
            <span className={styles.date}>{today}</span>

            {onRefresh && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? styles.spin : ""}
                />
              </button>
            )}

            <button
              type="button"
              className={styles.iconBtn}
              onClick={onLogout}
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {tabs.map((t) => (
            <button
              key={t.path}
              type="button"
              className={`${styles.tab} ${t.active ? styles.active : ""}`}
              aria-current={t.active ? "page" : undefined}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;
