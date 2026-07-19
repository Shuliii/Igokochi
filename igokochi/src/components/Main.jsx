import { useState } from "react";
import styles from "./Main.module.css";
import MenuList from "./MenuList";
import CategoryTabs from "./CategoryTabs";
import { useCart } from "../cart/CartContext";

const Main = () => {
  const { state } = useCart();
  const hasCartItems = state.items.length > 0;
  const [activeCategory, setActiveCategory] = useState("matcha");

  return (
    <main className={`${styles.main} ${hasCartItems ? styles.withCart : ""}`}>
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
      <MenuList activeCategory={activeCategory} />
    </main>
  );
};

export default Main;
