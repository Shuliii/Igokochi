// src/components/checkout/OrderSummaryCard.jsx
import styles from "./OrderSummaryCard.module.css";
import { useCart } from "../cart/CartContext";

const OrderSummaryCard = () => {
  const { state } = useCart();

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Order Summary</h3>

      <ul className={styles.list}>
        {state.items.map((item) => (
          <li key={item.id} className={styles.row}>
            <span className={styles.name}>
              {item.name} × {item.qty}
            </span>
            <span className={styles.price}>
              ${(item.price * item.qty).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>Total</span>
        <span className={styles.total}>${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummaryCard;
