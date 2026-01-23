import * as Dialog from "@radix-ui/react-dialog";
import {useMemo, useState} from "react";
import styles from "./PickupTimeModal.module.css";
import {X} from "lucide-react";

import OrderSummaryCard from "./OrderSummaryCard";
import PickupTimeCard from "./PickupTimeCard";
import CustomerFormCard from "./CustomerFormCard";
import {useCart} from "../cart/CartContext";

const PickupTimeModal = ({open, onOpenChange}) => {
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

  const handleSubmit = () => {
    const payload = {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
      },
      pickup: {
        date: pickup.date,
        slot: pickup.slot,
      },
      items: state.items, // includes qty
      total: Number(total.toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    console.log("MOCK SEND TO BACKEND:", payload);

    // Optional: clear cart after submit
    dispatch({type: "CLEAR_CART"});

    // Optional: reset form + close
    setPickup({date: "", slot: ""});
    setCustomer({name: "", phone: ""});
    onOpenChange(false);
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
