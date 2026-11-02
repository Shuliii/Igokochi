import * as Dialog from "@radix-ui/react-dialog";
import styles from "./OrderPlacedModal.module.css";
import OrderPlacedSummaryCard from "./OrderPlacedSummaryCard";

const OrderPlacedModal = ({open, onOpenChange, summary}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-label="Order placed">
          <img
            src="/assets/Igokochi House Logo Transparent.PNG"
            alt=""
            className={styles.logo}
          />

          <Dialog.Title className={styles.title}>Thank you!</Dialog.Title>

          <p className={styles.text}>
            Your order is in. We will confirm it with you on WhatsApp shortly.
          </p>

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
              Done
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default OrderPlacedModal;
