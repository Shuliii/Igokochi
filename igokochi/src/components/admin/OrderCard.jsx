import styles from "./OrderCard.module.css";

function formatPickupDate(ymdOrIso) {
  const raw = String(ymdOrIso || "");
  const ymd = raw.length >= 10 ? raw.slice(0, 10) : raw; // "YYYY-MM-DD"
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSlot(slot) {
  // "16:00-17:00" => "4–5pm"
  if (!slot) return "";
  const [a, b] = slot.split("-");
  return `${to12(a)}–${to12(b)}`;
}

function to12(hhmm) {
  const [hhStr] = hhmm.split(":");
  const h = Number(hhStr);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}${suffix}`;
}

function normalizeStatus(s) {
  return String(s || "new").toLowerCase();
}

function statusLabel(statusLower) {
  if (statusLower === "paid") return "PAID";
  if (statusLower === "ready") return "READY";
  if (statusLower === "done") return "DONE";
  return "NEW";
}

function toWhatsAppNumber(phone) {
  if (!phone) return null;

  // remove spaces, dashes, brackets
  let digits = String(phone).replace(/\D/g, "");

  // assume SG if 8 digits
  if (digits.length === 8) {
    digits = "65" + digits;
  }

  return digits;
}

function buildOrderItemsText(items) {
  if (!Array.isArray(items)) return "";
  return items.map((it) => `${it.qty}× ${it.name}`).join("\n");
}

function buildWhatsAppMessage(order) {
  const itemsText = buildOrderItemsText(order.items);
  const total = Number(order.total || 0).toFixed(2);

  return `Hi ${order.customer_name}

We've received your order at Igokochi House

Order details:
${itemsText}

Total: $${total}

Pickup time:
${formatPickupDate(order.pickup_date)} • ${formatSlot(order.pickup_slot)}

Please PayNow to this number.
Once payment is done, just reply "Paid" here :)

Thank you!`;
}

export default function OrderCard({ order, onSetStatus, tab }) {
  const status = normalizeStatus(order.status);

  // items might be already array OR JSON string
  let items = order.items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) items = [];

  const pickupText = `${formatPickupDate(order.pickup_date)} • ${formatSlot(
    order.pickup_slot,
  )}`;

  const total = Number(order.total || 0);

  const handleOpenWhatsApp = () => {
    const waNumber = toWhatsAppNumber(order.customer_phone);
    if (!waNumber) return;

    const message = buildWhatsAppMessage({ ...order, items });
    const encodedMessage = encodeURIComponent(message);

    const url = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className={`${styles.card} ${styles[`card_${status}`] || ""}`}>
      <div className={styles.topRow}>
        <div className={styles.leftTop}>
          <div className={styles.orderTitle}>Order #{order.id}</div>
          <div className={styles.pickup}>{pickupText}</div>
        </div>

        <div className={`${styles.status} ${styles[`status_${status}`] || ""}`}>
          {statusLabel(status)}
        </div>
      </div>

      <div className={styles.customerRow}>
        <div className={styles.customerName}>{order.customer_name}</div>

        <button
          type="button"
          className={styles.phoneBtn}
          onClick={handleOpenWhatsApp}
          title="Open WhatsApp"
        >
          {order.customer_phone}
        </button>
      </div>

      <div className={styles.itemsBox}>
        {items.length === 0 ? (
          <div className={styles.emptyItems}>No items</div>
        ) : (
          items.map((it, idx) => (
            <div key={`${it.id ?? it.name}-${idx}`} className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <span className={styles.itemName}>{it.name}</span>
                <span className={styles.itemQty}>×{it.qty}</span>
              </div>

              <div className={styles.itemPrice}>
                ${(Number(it.price || 0) * Number(it.qty || 0)).toFixed(2)}
              </div>
            </div>
          ))
        )}

        <div className={styles.divider} />

        <div className={styles.totalRow}>
          <span>Total</span>
          <span className={styles.totalValue}>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.actions}>
        {/* TODAY tab: 2 buttons always */}
        {tab === "today" && (
          <>
            <button
              type="button"
              className={styles.actionBtn}
              disabled={status !== "new"} // only new -> paid
              onClick={() => onSetStatus?.(order.id, "paid")}
            >
              Paid
            </button>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.primaryBtn}`}
              disabled={status !== "paid"} // must be paid first
              onClick={() => onSetStatus?.(order.id, "ready")}
            >
              Ready
            </button>
          </>
        )}

        {/* READY tab: 1 button */}
        {tab === "ready" && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
            disabled={status !== "ready"} // only ready -> done
            onClick={() => onSetStatus?.(order.id, "done")}
          >
            Done
          </button>
        )}
        {tab === "upcoming" && (
          <>
            <button
              type="button"
              className={styles.actionBtn}
              disabled={status !== "new"} // only new -> paid
              onClick={() => onSetStatus?.(order.id, "paid")}
            >
              Paid
            </button>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.primaryBtn}`}
              disabled={status !== "paid"} // must be paid first
              onClick={() => onSetStatus?.(order.id, "ready")}
            >
              Ready
            </button>
          </>
        )}
      </div>
    </article>
  );
}
