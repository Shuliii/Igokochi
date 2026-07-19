import {useEffect, useMemo, useState} from "react";
import {useCart} from "../cart/CartContext";
import {API_BASE_URL} from "../config";

export function useCheckout({onOrderPlaced, onConfirm, onClose} = {}) {
  const {state, dispatch} = useCart();

  const [pickup, setPickup] = useState({date: "", slot: ""});
  const [customer, setCustomer] = useState({name: "", phone: ""});

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [verifiedAmount, setVerifiedAmount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, type, discountAmount, total }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

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
    setVerifiedAmount(0);
    setShowPaymentDialog(false);
    setAppliedPromo(null);
  }, [total, state.items]);

  const canSubmit =
    itemCount > 0 &&
    pickup.date &&
    pickup.slot &&
    customer.name.trim() &&
    customer.phone.trim();

  const dismissError = () => setCheckoutError("");

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      const res = await fetch(`${API_BASE_URL}/promo/validate`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({code, items: state.items}),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setPromoError(data.message || "Invalid promo code");
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo({
        code: data.code,
        type: data.type,
        discountAmount: data.discountAmount,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleRejection = (data) => {
    const message = data.error || data.message || "Something went wrong";

    if (data.itemId) {
      dispatch({type: "REMOVE_ITEM_BY_ID", payload: {id: data.itemId}});
      setCheckoutError(`${message} It's been removed from your cart.`);
    } else if (data.promoInvalid) {
      setAppliedPromo(null);
      setPromoCode("");
      setCheckoutError(message);
    } else {
      setCheckoutError(message);
    }
  };

  const handleOpenPaymentDialog = async () => {
    try {
      setPaymentLoading(true);
      setQrImage(""); // force old QR to disappear
      setCheckoutError("");

      const res = await fetch(`${API_BASE_URL}/paynow-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: state.items,
          editable: false,
          promoCode: appliedPromo?.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("PayNow QR error:", data);
        handleRejection(data);
        return;
      }

      setQrImage(data.data.qrImage);
      setVerifiedAmount(data.amount);
      setShowPaymentDialog(true);
    } catch (err) {
      console.error(err);
      setCheckoutError("Failed to connect to PayNow QR service");
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
    setCheckoutError("");

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
      promoCode: appliedPromo?.code,
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
        handleRejection(data);
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
      setPromoCode("");
      setAppliedPromo(null);
      setPromoError("");

      onClose?.();
    } catch (err) {
      console.error(err);
      setCheckoutError("Network error: backend not reachable");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setQrImage("");
    setShowPaymentDialog(false);
  };

  return {
    pickup,
    setPickup,
    customer,
    setCustomer,
    showPaymentDialog,
    setShowPaymentDialog,
    qrImage,
    verifiedAmount,
    paymentLoading,
    submitting,
    checkoutError,
    dismissError,
    canSubmit,
    promoCode,
    setPromoCode,
    appliedPromo,
    promoLoading,
    promoError,
    handleApplyPromo,
    handleRemovePromo,
    handleOpenPaymentDialog,
    handleSaveQr,
    handleSubmit,
    handleBack,
  };
}
