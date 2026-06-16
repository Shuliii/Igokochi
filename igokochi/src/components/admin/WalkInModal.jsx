import {useState, useEffect} from "react";
import {apiGet, apiPost, apiPatch} from "../../admin/api";
import styles from "./WalkInModal.module.css";

export default function WalkInModal({onClose, onSuccess}) {
  const [menu, setMenu] = useState([]);
  const [qty, setQty] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet("/menu")
      .then((data) => {
        setMenu((data.menu || []).filter((i) => i.available));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const adjust = (id, delta) => {
    setQty((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const {[id]: _, ...rest} = prev;
        return rest;
      }
      return {...prev, [id]: next};
    });
  };

  const selectedItems = menu
    .filter((item) => qty[item.id])
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: qty[item.id],
      notes: "",
      selectedOptions: [],
      cartKey: `walkin-${item.id}`,
    }));

  const total = selectedItems.reduce(
    (sum, i) => sum + Number(i.price) * i.qty,
    0,
  );

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || submitting) return;
    setSubmitting(true);

    const now = new Date();
    const pickupDate = now.toISOString().slice(0, 10);
    const pickupSlot = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    try {
      const data = await apiPost("/orders", {
        customer: {name: "Walk-in", phone: "00000000"},
        pickup: {date: pickupDate, slot: pickupSlot},
        items: selectedItems,
        total,
      });

      await apiPatch(`/orders/${data.orderId}/status`, {status: "done"});
      onSuccess();
      onClose();
    } catch {
      alert("Failed to save walk-in order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Walk-in Order</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.hint}>Loading menu…</p>
          ) : menu.length === 0 ? (
            <p className={styles.hint}>No items available.</p>
          ) : (
            menu.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>
                    ${Number(item.price).toFixed(2)}
                  </span>
                </div>
                <div className={styles.qtyControl}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => adjust(item.id, -1)}
                    disabled={!qty[item.id]}
                  >
                    −
                  </button>
                  <span
                    className={`${styles.qtyValue} ${qty[item.id] ? styles.qtyActive : ""}`}
                  >
                    {qty[item.id] || 0}
                  </span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => adjust(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.total}>
            Total <strong>${total.toFixed(2)}</strong>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || submitting}
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
