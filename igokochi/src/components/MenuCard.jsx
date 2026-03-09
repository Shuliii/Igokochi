import styles from "./MenuCard.module.css";
import { Plus } from "lucide-react";

const MenuCard = ({ item, onAdd }) => {
  return (
    <div className={styles.card}>
      <img
        src={item.image || "https://picsum.photos/80"}
        alt={item.name}
        className={styles.image}
      />

      <div className={styles.content}>
        <h3 className={styles.title}>{item.name}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.bottomRow}>
          <span className={styles.price}>${item.price.toFixed(2)}</span>

          <button
            className={styles.addButton}
            onClick={onAdd}
            aria-label={`Add ${item.name} to cart`}
            type="button"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
