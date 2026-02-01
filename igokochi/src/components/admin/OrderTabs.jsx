import styles from "./OrderTabs.module.css";

const OrderTabs = ({value, counts, onChange}) => {
  return (
    <div className={styles.wrap} role="tablist" aria-label="Order filter">
      <button
        type="button"
        role="tab"
        aria-selected={value === "today"}
        className={`${styles.tab} ${value === "today" ? styles.active : ""}`}
        onClick={() => onChange("today")}
      >
        Today <span className={styles.count}>{counts.today}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={value === "ready"}
        className={`${styles.tab} ${value === "ready" ? styles.active : ""}`}
        onClick={() => onChange("ready")}
      >
        Ready <span className={styles.count}>{counts.ready}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={value === "upcoming"}
        className={`${styles.tab} ${value === "upcoming" ? styles.active : ""}`}
        onClick={() => onChange("upcoming")}
      >
        Upcoming <span className={styles.count}>{counts.upcoming}</span>
      </button>
    </div>
  );
};

export default OrderTabs;
