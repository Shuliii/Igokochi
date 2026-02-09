import { useState } from "react";

import Header from "../components/Header";
import Main from "../components/Main";
import StickyCart from "../components/StickyCart";
import PickupTimeModal from "../components/PickupTimeModal";
import OrderPlacedModal from "../components/OrderPlacedModal";

const CustomerPage = () => {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupSelection, setPickupSelection] = useState(null);

  const [successOpen, setSuccessOpen] = useState(false);

  //const [lastOrderId, setLastOrderId] = useState(null); // ✅ add this
  const [orderSnapshot, setOrderSnapshot] = useState(null);

  const onCheckout = () => setPickupOpen(true);

  // ✅ now expects { orderId, items, total }
  const handleOrderPlaced = ({ items, pickup }) => {
    //setLastOrderId(orderId);
    setOrderSnapshot({ items, pickup });
    setSuccessOpen(true);
  };

  return (
    <>
      <Header onCheckout={onCheckout} />
      <Main />
      <StickyCart onCheckout={onCheckout} />

      <PickupTimeModal
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        onConfirm={(selection) => setPickupSelection(selection)}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderPlacedModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        //orderId={lastOrderId}
        summary={orderSnapshot}
      />
    </>
  );
};

export default CustomerPage;
