import styles from "./Main.module.css";
import MenuList from "./MenuList";
import { useCart } from "../cart/CartContext";

const Main = () => {
  const { state } = useCart();
  const hasCartItems = state.items.length > 0;

  return (
    <main className={`${styles.main} ${hasCartItems ? styles.withCart : ""}`}>
      <section className={styles.hero}>
        <p className={styles.kicker}>居心地 · a place that feels like home</p>
        <h1 className={styles.heading}>Matcha, made slowly.</h1>
        <p className={styles.sub}>Order ahead, then pick up at the time that suits you.</p>
      </section>

      <MenuList />
    </main>
  );
};

export default Main;
