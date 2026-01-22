// src/components/StickyCart.jsx
import styles from "./StickyCart.module.css";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../cart/CartContext";

const StickyCart = ({ onCheckout }) => {
  const { state } = useCart();

  const itemCount = state.items.reduce((sum, item) => sum + item.qty, 0);
  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  // Hide when cart is empty
  if (itemCount === 0) return null;

  const handleCheckout = () => {
    // Later you can open your pickup-time / checkout modal here
    if (onCheckout) onCheckout();
    else alert("Next: pickup time / checkout");
  };

  return (
    <div className={styles.wrapper} role="region" aria-label="Cart summary">
      <div className={styles.bar}>
        <div className={styles.left}>
          <span className={styles.cartIconWrap} aria-hidden="true">
            <ShoppingCart size={20} className={styles.cartIcon} />
            <span className={styles.cartBadge}>{itemCount}</span>
          </span>

          <div className={styles.summary}>
            <div className={styles.total}>${total.toFixed(2)}</div>
            <div className={styles.itemsText}>
              {itemCount} item{itemCount > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <button type="button" className={styles.cta} onClick={handleCheckout}>
          Pick pickup time
        </button>
      </div>
    </div>
  );
};

export default StickyCart;
