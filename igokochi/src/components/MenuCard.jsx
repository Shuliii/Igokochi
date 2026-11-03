import { useState, useEffect, useRef } from "react";
import styles from "./MenuCard.module.css";
import { Plus, Minus } from "lucide-react";
import { menuImageUrl } from "../utils/menuImage";
import MenuBadge from "./MenuBadge";

const MenuCard = ({ item, onOpen, onAdd, onDecrement, totalQty = 0 }) => {
  const isAvailable = item.available !== false;
  const imageSrc = menuImageUrl(item.image_path) || "https://picsum.photos/80";

  const prevQtyRef = useRef(totalQty);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const prev = prevQtyRef.current;
    prevQtyRef.current = totalQty;
    if (totalQty > 1 && prev > 0 && totalQty !== prev) {
      setBounce(true);
      const id = setTimeout(() => setBounce(false), 160);
      return () => clearTimeout(id);
    }
  }, [totalQty]);

  return (
    <div className={`${styles.card} ${!isAvailable ? styles.unavailable : ""}`}>
      {/* covers the whole card so a tap anywhere opens details; the +/- controls sit above it */}
      <button
        type="button"
        className={styles.openArea}
        onClick={onOpen}
        aria-label={`View ${item.name}`}
      />

      <div className={styles.photo}>
        <img
          src={imageSrc}
          alt={item.name}
          className={styles.image}
          loading="lazy"
          decoding="async"
        />
        {isAvailable ? (
          item.badge && (
            <div className={styles.photoBadge}>
              <MenuBadge badge={item.badge} />
            </div>
          )
        ) : (
          <span className={styles.soldOut}>Sold out</span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{item.name}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.bottomRow}>
          <span className={styles.price}>${Number(item.price).toFixed(2)}</span>

          {isAvailable &&
            (totalQty > 0 ? (
              <div className={`${styles.stepper} ${styles.stepperIn}`}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={onDecrement}
                  aria-label="Remove one"
                >
                  <Minus size={13} />
                </button>
                <span className={`${styles.qty} ${bounce ? styles.qtyBounce : ""}`}>
                  {totalQty}
                </span>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={onAdd}
                  aria-label="Add one more"
                >
                  <Plus size={13} />
                </button>
              </div>
            ) : (
              <button
                className={styles.addButton}
                onClick={onAdd}
                aria-label={`Add ${item.name} to cart`}
                type="button"
              >
                <Plus size={18} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
