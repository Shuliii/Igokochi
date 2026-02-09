import * as Dialog from "@radix-ui/react-dialog";
import styles from "./OrderPlacedModal.module.css";
import { CheckCircle2 } from "lucide-react";
import OrderPlacedSummaryCard from "./OrderPlacedSummaryCard";

const OrderPlacedModal = ({ open, onOpenChange, summary }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-label="Order placed">
          <div className={styles.icon}>
            <CheckCircle2 size={28} />
          </div>

          <Dialog.Title className={styles.title}>Order placed!</Dialog.Title>

          <p className={styles.text}>Thanks! We’ll have it ready for pickup.</p>

          {summary?.items?.length ? (
            <div className={styles.summaryWrap}>
              <OrderPlacedSummaryCard
                items={summary.items}
                pickup={summary.pickup}
              />
            </div>
          ) : null}

          <Dialog.Close asChild>
            <button className={styles.button} type="button">
              OK
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default OrderPlacedModal;
