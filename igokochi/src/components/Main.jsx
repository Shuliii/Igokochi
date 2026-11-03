import styles from "./Main.module.css";
import MenuList from "./MenuList";
import { useCart } from "../cart/CartContext";

const Main = () => {
  const { state } = useCart();
  const hasCartItems = state.items.length > 0;

  return (
    <main className={`${styles.main} ${hasCartItems ? styles.withCart : ""}`}>
      <section className={styles.hero}>
        <p className={styles.meaning}>
          Igokochi (居心地) - the feeling of comfort and coziness of being in a
          place, usually a home.
        </p>
        <p className={styles.sub}>Order ahead, then pick up at the time that suits you.</p>
      </section>

      <MenuList />
    </main>
  );
};

export default Main;
