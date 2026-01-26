// src/components/admin/AdminHeader.jsx
import styles from "./AdminHeader.module.css";
import {RefreshCw} from "lucide-react";

const AdminHeader = ({onRefresh, refreshing}) => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  console.log("refreshing:", refreshing);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <span className={styles.title}>Igokochi Admin</span>

        <div className={styles.right}>
          <span className={styles.date}>{today}</span>

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
