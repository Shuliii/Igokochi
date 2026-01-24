// src/components/StickyCart.jsx
import {useEffect, useMemo, useRef, useState} from "react";
import styles from "./StickyCart.module.css";
import {ShoppingCart} from "lucide-react";
import {useCart} from "../cart/CartContext";

const ANIM_MS = 220;

const StickyCart = ({onCheckout}) => {
  const {state} = useCart();

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.qty, 0),
    [state.items],
  );

  const total = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [state.items],
  );

  // --- Animation mount/unmount control ---
  const prevCountRef = useRef(itemCount);
  const [mounted, setMounted] = useState(itemCount > 0);
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    const prev = prevCountRef.current;

    // 0 -> >0 : mount then slide in
    if (prev === 0 && itemCount > 0) {
      setMounted(true);
      setAnimClass(styles.in);
      const t = setTimeout(() => setAnimClass(""), ANIM_MS);
      prevCountRef.current = itemCount;
      return () => clearTimeout(t);
    }

    // >0 -> 0 : slide out then unmount
    if (prev > 0 && itemCount === 0) {
      setAnimClass(styles.out);
      const t = setTimeout(() => {
        setMounted(false);
        setAnimClass("");
      }, ANIM_MS);
      prevCountRef.current = itemCount;
      return () => clearTimeout(t);
    }

    prevCountRef.current = itemCount;
  }, [itemCount]);

  if (!mounted) return null;

  const handleCheckout = () => {
    if (onCheckout) onCheckout();
  };

  return (
    <div
      className={`${styles.wrapper} ${animClass}`}
      role="region"
      aria-label="Cart summary"
    >
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
