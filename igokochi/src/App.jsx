import {useState} from "react";
import {CartProvider} from "./cart/CartContext";

import Header from "./components/Header";
import Main from "./components/Main";
import StickyCart from "./components/StickyCart";
import PickupTimeModal from "./components/PickupTimeModal";

import "./App.css";

function App() {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupSelection, setPickupSelection] = useState(null);

  const onCheckout = () => {
    setPickupOpen(true);
  };
  return (
    <CartProvider>
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
      />
    </CartProvider>
  );
}

export default App;
