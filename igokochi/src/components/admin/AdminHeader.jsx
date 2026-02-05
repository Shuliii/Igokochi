import styles from "./AdminHeader.module.css";
import { RefreshCw, LogOut } from "lucide-react";

const AdminHeader = ({ onRefresh, refreshing, onLogout }) => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const username = localStorage.getItem("igokochi_profile");

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* LEFT */}
        <span className={styles.title}>Igokochi Admin</span>

        {/* RIGHT */}
        <div className={styles.right}>
          <div className={styles.meta}>
            <span className={styles.username}>{username}</span>
            <span className={styles.date}>{today}</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh orders"
              title="Refresh orders"
            >
              <RefreshCw size={18} className={refreshing ? styles.spin : ""} />
            </button>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
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
