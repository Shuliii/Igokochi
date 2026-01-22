// src/components/PickupTimeModal.jsx
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./PickupTimeModal.module.css";
import { X } from "lucide-react";

import OrderSummaryCard from "./OrderSummaryCard";
import PickupTimeCard from "./PickupTimeCard";

const PickupTimeModal = ({ open, onOpenChange }) => {
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
              <PickupTimeCard />
            </div>

            {/* later: form card */}
            {/* <div className={styles.section}><CustomerFormCard /></div> */}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.primaryBtn}>
              Continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PickupTimeModal;
