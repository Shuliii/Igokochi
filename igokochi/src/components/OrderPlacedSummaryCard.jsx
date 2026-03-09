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

function formatOptions(item) {
  if (!item.selectedOptions?.length) return "";

  return item.selectedOptions.map((opt) => opt.optionName).join(" • ");
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
        {items.map((item) => {
          const optionsText = formatOptions(item);

          return (
            <li key={item.cartKey || item.id} className={styles.itemBlock}>
              <div className={styles.row}>
                <span className={styles.name}>
                  {item.name} × {item.qty}
                </span>
              </div>

              {optionsText && <div className={styles.meta}>{optionsText}</div>}

              {item.notes && (
                <div className={styles.note}>Note: {item.notes}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OrderPlacedSummaryCard;
