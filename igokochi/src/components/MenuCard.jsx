// src/components/MenuCard.jsx
import styles from "./MenuCard.module.css";
import { Plus, Minus } from "lucide-react";
import { useCart } from "../cart/CartContext";

const MenuCard = ({ item }) => {
  const { state, dispatch } = useCart();

  const cartItem = state.items.find((i) => i.id === item.id);
  const qty = cartItem ? cartItem.qty : 0;

  const addToCart = () => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeFromCart = () => {
    dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } });
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

          {/* Quantity control */}
          {qty === 0 ? (
            <button
              type="button"
              className={styles.addButton}
              aria-label={`Add ${item.name} to cart`}
              onClick={addToCart}
            >
              <Plus size={18} />
            </button>
          ) : (
            <div className={styles.qtyControl} aria-label="Quantity controls">
              <button
                type="button"
                className={styles.qtyButton}
                aria-label={`Decrease ${item.name} quantity`}
                onClick={removeFromCart}
              >
                <Minus size={16} />
              </button>

              <span className={styles.qty}>{qty}</span>

              <button
                type="button"
                className={styles.qtyButton}
                aria-label={`Increase ${item.name} quantity`}
                onClick={addToCart}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
