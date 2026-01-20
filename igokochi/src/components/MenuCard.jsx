// src/components/MenuCard.jsx
import styles from "./MenuCard.module.css";
import { Plus } from "lucide-react";
import { useCart } from "../cart/CartContext";

const MenuCard = ({ item }) => {
  const { dispatch } = useCart();

  const addToCart = () => {
    console.log("adding");
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.id,
        name: item.name,
        qty: 1,
      },
    });
  };
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
            type="button"
            className={styles.addButton}
            aria-label="Add to cart"
            onClick={addToCart}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
