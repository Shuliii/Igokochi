import * as Dialog from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import styles from "./PickupTimeModal.module.css";
import ErrorBanner from "./ErrorBanner";

const PaymentDialog = ({
  open,
  onOpenChange,
  verifiedAmount,
  qrImage,
  errorMessage,
  onDismissError,
  submitting,
  onSubmit,
  onSaveQr,
  onBack,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content} aria-label="PayNow Payment">
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>PayNow Payment</Dialog.Title>
            <Dialog.Description className={styles.srOnly}>
              Scan the PayNow QR code to complete payment.
            </Dialog.Description>

            <Dialog.Close asChild>
              <button className={styles.closeBtn} aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <ErrorBanner message={errorMessage} onDismiss={onDismissError} />

          <div className={styles.paymentBody}>
            <div className={styles.amountBox}>
              <span>Total Amount</span>
              <strong>${verifiedAmount.toFixed(2)}</strong>
            </div>

            {qrImage && (
              <div className={styles.qrCard}>
                <img src={qrImage} alt="PayNow QR Code" className={styles.qrImage} />

                <button
                  type="button"
                  className={styles.saveQrBtn}
                  onClick={onSaveQr}
                >
                  Save QR Code
                </button>
              </div>
            )}

            <p className={styles.paymentText}>
              Scan this QR code with your banking app to pay.
            </p>

            <p className={styles.paymentNote}>
              After payment, tap <b>I Have Paid</b> to submit your order.
            </p>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={submitting}
              onClick={onSubmit}
            >
              {submitting ? "Submitting..." : "I Have Paid"}
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={submitting}
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PaymentDialog;
