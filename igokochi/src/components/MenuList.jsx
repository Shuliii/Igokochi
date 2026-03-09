import { useState } from "react";
import MenuCard from "./MenuCard";
import menu from "../data/menu";
import styles from "./MenuList.module.css";
import { useCart } from "../cart/CartContext";
import CustomizationModal from "./CustomizationModal";

const MenuList = () => {
  const { dispatch } = useCart();
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAddClick = (item) => {
    if (item.modifiers?.length) {
      setSelectedItem(item);
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          qty: 1,
          notes: "",
          selectedOptions: [],
        },
      });
    }
  };

  return (
    <>
      <section className={styles.list}>
        {menu.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            onAdd={() => handleAddClick(item)}
          />
        ))}
      </section>

      <CustomizationModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default MenuList;
