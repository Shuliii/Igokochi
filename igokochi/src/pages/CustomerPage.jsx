import {useState} from "react";

import Header from "../components/Header";
import Main from "../components/Main";
import StickyCart from "../components/StickyCart";
import PickupTimeModal from "../components/PickupTimeModal";
import OrderPlacedModal from "../components/OrderPlacedModal";

const CustomerPage = () => {
  const [pickupOpen, setPickupOpen] = useState(false);

  // optional: if you still want to keep pickup selection
  const [pickupSelection, setPickupSelection] = useState(null);

  // success modal state
  const [successOpen, setSuccessOpen] = useState(false);
  // const [lastOrderId, setLastOrderId] = useState(null);

  const onCheckout = () => setPickupOpen(true);

  const handleOrderPlaced = (orderId) => {
    // setLastOrderId(orderId);
    setSuccessOpen(true);
  };

  console.log("test");

  return (
    <>
      <Header onCheckout={onCheckout} />
      <Main />
      <StickyCart onCheckout={onCheckout} />

      <PickupTimeModal
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        onConfirm={(selection) => {
          setPickupSelection(selection);
          console.log("Pickup selected:", selection);
        }}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderPlacedModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        // orderId={lastOrderId}
      />
    </>
  );
};

export default CustomerPage;
