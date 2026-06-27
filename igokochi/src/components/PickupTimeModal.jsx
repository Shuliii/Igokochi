import * as Dialog from "@radix-ui/react-dialog";
import {useEffect, useMemo, useState} from "react";
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

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.qty, 0),
    [state.items],
  );

  const total = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [state.items],
  );

  useEffect(() => {
    setQrImage("");
    setShowPaymentDialog(false);
  }, [total, state.items]);

  const canSubmit =
    itemCount > 0 &&
    pickup.date &&
    pickup.slot &&
    customer.name.trim() &&
    customer.phone.trim();

  const handleOpenPaymentDialog = async () => {
    try {
      setPaymentLoading(true);
      setQrImage(""); // force old QR to disappear

      const amount = Number(total.toFixed(2));

      const res = await fetch(`${API_BASE_URL}/paynow-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          editable: false,
          reference: `ORDER-${Date.now()}`, // optional if backend supports it
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("PayNow QR error:", data);
        alert(data.error || "Failed to generate PayNow QR");
        return;
      }

      setQrImage(data.data.qrImage);
      setShowPaymentDialog(true);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to PayNow QR service");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSaveQr = () => {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `paynow-qr-${Date.now()}.png`;
    link.click();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

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
      payment: {
        method: "paynow",
        status: "pending_verification",
      },
      createdAt: new Date().toISOString(),
    };

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

      onConfirm?.(payload.pickup);

      onOrderPlaced?.({
        items: state.items,
        pickup: payload.pickup,
      });

      dispatch({type: "CLEAR_CART"});

      setPickup({date: "", slot: ""});
      setCustomer({name: "", phone: ""});
      setQrImage("");
      setShowPaymentDialog(false);

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Network error: backend not reachable");
    } finally {
      setSubmitting(false);
    }
  };

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
                disabled={!canSubmit || paymentLoading}
                onClick={handleOpenPaymentDialog}
              >
                {paymentLoading ? "Generating QR..." : "Proceed to Payment"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />

          <Dialog.Content
            className={styles.content}
            aria-label="PayNow Payment"
          >
            <div className={styles.header}>
              <Dialog.Title className={styles.title}>
                PayNow Payment
              </Dialog.Title>
              <Dialog.Description className={styles.srOnly}>
                Scan the PayNow QR code to complete payment.
              </Dialog.Description>

              <Dialog.Close asChild>
                <button className={styles.closeBtn} aria-label="Close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <div className={styles.paymentBody}>
              <div className={styles.amountBox}>
                <span>Total Amount</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              {qrImage && (
                <div className={styles.qrCard}>
                  <img
                    src={qrImage}
                    alt="PayNow QR Code"
                    className={styles.qrImage}
                  />

                  <button
                    type="button"
                    className={styles.saveQrBtn}
                    onClick={handleSaveQr}
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
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "I Have Paid"}
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={submitting}
                onClick={() => {
                  setQrImage("");
                  setShowPaymentDialog(false);
                }}
              >
                Back
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default PickupTimeModal;
