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

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.brand}>
            <img
              src="/assets/Igokochi House Logo_White transparent.PNG"
              alt="Igokochi"
              className={styles.logo}
            />
            <span className={styles.title}>Admin</span>
          </div>

          {/* NAV */}
          <div className={styles.nav}>
            <button
              className={`${styles.tab} ${isOrders ? styles.active : ""}`}
              onClick={() => navigate("/admin")}
            >
              Orders
            </button>

            <button
              className={`${styles.tab} ${isMenu ? styles.active : ""}`}
              onClick={() => navigate("/admin/menu")}
            >
              Menus
            </button>

            <button
              className={`${styles.tab} ${isSchedule ? styles.active : ""}`}
              onClick={() => navigate("/admin/schedule")}
            >
              Schedule
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <span className={styles.date}>{today}</span>

          <div className={styles.actions}>
            {onRefresh && (
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? styles.spin : ""}
                />
              </button>
            )}

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={onLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
