import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Header.module.css";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../cart/CartContext";

const POP_MS = 180;

const Header = ({ onCheckout }) => {
  const { state } = useCart();

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.qty, 0),
    [state.items],
  );

  const prevRef = useRef(itemCount);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (itemCount > prev) {
      setPop(true);
      const t = setTimeout(() => setPop(false), POP_MS);
      return () => clearTimeout(t);
    }
    prevRef.current = itemCount;
  }, [itemCount]);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Igokochi House</h1>

        <button className={styles.cartBtn} type="button" onClick={onCheckout}>
          <ShoppingCart />

          {itemCount > 0 && (
            <span className={`${styles.badge} ${pop ? styles.badgePop : ""}`}>
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
