import styles from "./MenuCard.module.css";
import { Plus } from "lucide-react";

const MenuCard = ({ item, onAdd }) => {
  const isAvailable = item.available !== false; // default = true
  const imageSrc = item.image_path
    ? `/assets/${item.image_path}`
    : "https://picsum.photos/80";

  return (
    <div className={styles.card}>
      <img src={imageSrc} alt={item.name} className={styles.image} />

      <div className={styles.content}>
        <h3 className={styles.title}>{item.name}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.bottomRow}>
          <span className={styles.price}>${Number(item.price).toFixed(2)}</span>

          {!isAvailable ? (
            <span className={styles.soldOut}>Sold Out</span>
          ) : (
            <button
              className={styles.addButton}
              onClick={onAdd}
              aria-label={`Add ${item.name} to cart`}
              type="button"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
