import styles from "./Header.module.css";
import {ShoppingCart} from "lucide-react";
import {useCart} from "../cart/CartContext";

const Header = ({onCheckout}) => {
  const {state} = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    // Later you can open your pickup-time / checkout modal here
    if (onCheckout) onCheckout();
    else alert("Next: pickup time / checkout");
  };
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Igokochi House</h1>
        <button
          className={styles.cartButton}
          type="button"
          aria-label="Cart"
          onClick={handleCheckout}
        >
          <span className={styles.cartIconWrap}>
            <ShoppingCart size={24} className={styles.cartIcon} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
