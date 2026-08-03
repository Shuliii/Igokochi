import * as Dialog from "@radix-ui/react-dialog";
import styles from "./ConfirmDialog.module.css";

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content}>
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>

          {description && (
            <Dialog.Description className={styles.description}>
              {description}
            </Dialog.Description>
          )}

          <div className={styles.actions}>
            <Dialog.Close asChild>
              <button type="button" className={styles.cancelBtn}>
                {cancelLabel}
              </button>
            </Dialog.Close>

            <button
              type="button"
              className={`${styles.confirmBtn} ${destructive ? styles.destructiveBtn : ""}`}
              onClick={() => {
                onOpenChange(false);
                onConfirm?.();
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
