import styles from "./OrderPlacedSummaryCard.module.css";

function formatPickup(pickup) {
  const d = new Date(pickup.date);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${date} • ${pickup.slot}`;
}

const OrderPlacedSummaryCard = ({ items = [], pickup }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Pickup Details</h3>

      {pickup?.date && pickup?.slot ? (
        <div className={styles.pickup}>
          <div className={styles.label}>Pickup</div>
          <div className={styles.value}>{formatPickup(pickup)}</div>
        </div>
      ) : null}

      <div className={styles.divider} />

      <h4 className={styles.subtitle}>Items</h4>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <span className={styles.name}>
              {item.name} × {item.qty}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderPlacedSummaryCard;
