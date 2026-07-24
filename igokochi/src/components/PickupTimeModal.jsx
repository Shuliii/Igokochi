import * as Dialog from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import styles from "./PickupTimeModal.module.css";

import OrderSummaryCard from "./OrderSummaryCard";
import PickupTimeCard from "./PickupTimeCard";
import CustomerFormCard from "./CustomerFormCard";
import ErrorBanner from "./ErrorBanner";
import PaymentDialog from "./PaymentDialog";
import {useCheckout} from "../hooks/useCheckout";

const PickupTimeModal = ({open, onOpenChange, onOrderPlaced, onConfirm}) => {
  const checkout = useCheckout({
    onOrderPlaced,
    onConfirm,
    onClose: () => onOpenChange(false),
  });

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />

          <Dialog.Content className={styles.content} aria-label="Checkout">
            <div className={styles.header}>
              <Dialog.Title className={styles.title}>Checkout</Dialog.Title>
              <Dialog.Description className={styles.srOnly}>
                Review your order, choose a pickup date and time slot, and enter
                your contact details.
              </Dialog.Description>

              <Dialog.Close asChild>
                <button className={styles.closeBtn} aria-label="Close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <ErrorBanner
              message={checkout.checkoutError}
              onDismiss={checkout.dismissError}
            />

            <div className={styles.body}>
              <div className={styles.section}>
                <OrderSummaryCard
                  promoCode={checkout.promoCode}
                  onPromoCodeChange={checkout.setPromoCode}
                  appliedPromo={checkout.appliedPromo}
                  promoLoading={checkout.promoLoading}
                  promoError={checkout.promoError}
                  onApplyPromo={checkout.handleApplyPromo}
                  onRemovePromo={checkout.handleRemovePromo}
                />
              </div>

              <div className={styles.section}>
                <PickupTimeCard value={checkout.pickup} onChange={checkout.setPickup} />
              </div>

              <div className={styles.section}>
                <CustomerFormCard value={checkout.customer} onChange={checkout.setCustomer} />
              </div>
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!checkout.canSubmit || checkout.paymentLoading}
                onClick={checkout.handleOpenPaymentDialog}
              >
                {checkout.paymentLoading ? "Generating QR..." : "Proceed to Payment"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <PaymentDialog
        open={checkout.showPaymentDialog}
        onOpenChange={checkout.setShowPaymentDialog}
        verifiedAmount={checkout.verifiedAmount}
        qrImage={checkout.qrImage}
        errorMessage={checkout.checkoutError}
        onDismissError={checkout.dismissError}
        submitting={checkout.submitting}
        onSubmit={checkout.handleSubmit}
        onSaveQr={checkout.handleSaveQr}
        onBack={checkout.handleBack}
      />
    </>
  );
};

export default PickupTimeModal;
