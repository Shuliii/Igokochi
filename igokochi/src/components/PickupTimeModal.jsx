import * as Dialog from "@radix-ui/react-dialog";
import {useMemo, useState} from "react";
import styles from "./PickupTimeModal.module.css";
import {X} from "lucide-react";

import OrderSummaryCard from "./OrderSummaryCard";
import PickupTimeCard from "./PickupTimeCard";
import CustomerFormCard from "./CustomerFormCard";
import {useCart} from "../cart/CartContext";

import {API_BASE_URL} from "../config";

const PickupTimeModal = ({open, onOpenChange, onOrderPlaced, onConfirm}) => {
  const {state, dispatch} = useCart();

  const [pickup, setPickup] = useState({date: "", slot: ""});
  const [customer, setCustomer] = useState({name: "", phone: ""});

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.qty, 0),
    [state.items],
  );

  const total = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [state.items],
  );

  const canSubmit =
    itemCount > 0 &&
    pickup.date &&
    pickup.slot &&
    customer.name.trim() &&
    customer.phone.trim();

  const handleSubmit = async () => {
    const payload = {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
      },
      pickup: {
        date: pickup.date,
        slot: pickup.slot,
      },
      items: state.items,
      total: Number(total.toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    console.log("SENDING TO BACKEND:", payload);

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        alert(data.message || "Failed to submit order");
        return;
      }

      console.log("Order created:", data);

      // (optional) if you still want to store selection outside
      onConfirm?.(payload.pickup);

      // clear cart AFTER success
      dispatch({type: "CLEAR_CART"});

      // reset modal local state (nice for next order)
      setPickup({date: "", slot: ""});
      setCustomer({name: "", phone: ""});

      // close checkout modal
      onOpenChange(false);

      // open success modal
      onOrderPlaced?.(data.orderId);
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error: backend not reachable");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content} aria-label="Checkout">
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>Checkout</Dialog.Title>

            <Dialog.Close asChild>
              <button className={styles.closeBtn} aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            <div className={styles.section}>
              <OrderSummaryCard />
            </div>

            <div className={styles.section}>
              <PickupTimeCard value={pickup} onChange={setPickup} />
            </div>

            <div className={styles.section}>
              <CustomerFormCard value={customer} onChange={setCustomer} />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Submit Order
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PickupTimeModal;
