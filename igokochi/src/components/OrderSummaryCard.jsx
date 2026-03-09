import styles from "./OrderSummaryCard.module.css";
import { useCart } from "../cart/CartContext";

const OrderSummaryCard = ({ items: itemsProp, total: totalProp }) => {
  const { state, dispatch } = useCart();

  const items = itemsProp ?? state.items;

  const total =
    totalProp ?? items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleDecrease = (item) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: { cartKey: item.cartKey },
    });
  };

  const handleIncrease = (item) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        ...item,
        qty: 1,
      },
    });
  };

  // const handleDelete = (item) => {
  //   dispatch({
  //     type: "DELETE_ITEM",
  //     payload: { cartKey: item.cartKey },
  //   });
  // };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Order Summary</h3>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.cartKey} className={styles.itemBlock}>
            <div className={styles.rowTop}>
              <div className={styles.info}>
                <span className={styles.name}>{item.name}</span>

                {!!item.selectedOptions?.length && (
                  <div className={styles.meta}>
                    {item.selectedOptions.map((opt) => (
                      <div
                        key={`${item.cartKey}-${opt.modifierId}`}
                        className={styles.metaLine}
                      >
                        {opt.modifierName}: {opt.optionName}
                      </div>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className={styles.note}>Note: {item.notes}</div>
                )}
              </div>

              <span className={styles.price}>
                ${(item.price * item.qty).toFixed(2)}
              </span>
            </div>

            <div className={styles.rowBottom}>
              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => handleDecrease(item)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>

                <span className={styles.qty}>{item.qty}</span>

                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => handleIncrease(item)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>

              {/* <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleDelete(item)}
              >
                Remove
              </button> */}
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>Total</span>
        <span className={styles.total}>${Number(total).toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderSummaryCard;
