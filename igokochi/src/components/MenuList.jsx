import MenuCard from "./MenuCard";
import menu from "../data/menu";
import styles from "./MenuList.module.css";

const MenuList = () => {
  return (
    <section className={styles.list}>
      {menu.map((item) => (
        <MenuCard key={item.id} item={item} />
      ))}
    </section>
  );
};

export default MenuList;
