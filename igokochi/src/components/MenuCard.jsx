import {useEffect, useMemo, useRef, useState} from "react";
import styles from "./MenuCard.module.css";
import {Plus, Minus} from "lucide-react";
import {useCart} from "../cart/CartContext";

const ANIM_MS = 220;

const MenuCard = ({item}) => {
  const {state, dispatch} = useCart();

  // qty for THIS item
  const qty = useMemo(() => {
    const found = state.items.find((i) => i.id === item.id);
    return found ? found.qty : 0;
  }, [state.items, item.id]);

  const prevQtyRef = useRef(qty);

  // keep stepper mounted briefly so exit animation can play
  const [showStepper, setShowStepper] = useState(qty > 0);
  const [animClass, setAnimClass] = useState(""); // styles.stepperIn / styles.stepperOut

  useEffect(() => {
    const prev = prevQtyRef.current;

    // + -> -1+
    if (prev === 0 && qty === 1) {
      setShowStepper(true);
      setAnimClass(styles.stepperIn);

      const t = setTimeout(() => setAnimClass(""), ANIM_MS);
      prevQtyRef.current = qty;
      return () => clearTimeout(t);
    }

    // -1+ -> +
    if (prev === 1 && qty === 0) {
      setAnimClass(styles.stepperOut);

      const t = setTimeout(() => {
        setShowStepper(false); // now switch to "+"
        setAnimClass("");
      }, ANIM_MS);

      prevQtyRef.current = qty;
      return () => clearTimeout(t);
    }

    // steady state
    setShowStepper(qty > 0);
    prevQtyRef.current = qty;
  }, [qty]);

  const addOne = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {id: item.id, name: item.name, price: item.price},
    });
  };

  const removeOne = () => {
    dispatch({type: "REMOVE_ITEM", payload: {id: item.id}});
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

          {/* Reserve space so layout doesn't shift */}
          <div className={styles.controlsWrap}>
            {!showStepper ? (
              <button
                className={styles.addButton}
                onClick={addOne}
                aria-label="Add to cart"
                type="button"
              >
                <Plus size={18} />
              </button>
            ) : (
              <div
                className={`${styles.stepper} ${animClass}`}
                aria-label="Quantity controls"
              >
                <button
                  className={styles.stepBtn}
                  onClick={removeOne}
                  aria-label="Decrease"
                  type="button"
                >
                  <Minus size={16} />
                </button>

                <span className={styles.qty}>{qty}</span>

                <button
                  className={styles.stepBtn}
                  onClick={addOne}
                  aria-label="Increase"
                  type="button"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
