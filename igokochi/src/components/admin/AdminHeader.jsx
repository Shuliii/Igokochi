import styles from "./AdminHeader.module.css";
import {RefreshCw} from "lucide-react";

const AdminHeader = ({onRefresh, refreshing}) => {
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
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
