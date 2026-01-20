import styles from "./Main.module.css";
import MenuList from "./MenuList";
import { useCart } from "../cart/CartContext";

const Main = () => {
  const { state } = useCart();
  const hasCartItems = state.items.length > 0;

  return (
    <main className={`${styles.main} ${hasCartItems ? styles.withCart : ""}`}>
      <MenuList />
    </main>
  );
};

export default Main;
