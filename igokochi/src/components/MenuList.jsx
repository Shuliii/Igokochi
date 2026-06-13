import { useEffect, useState } from "react";
import MenuCard from "./MenuCard";
import { fetchMenu } from "../data/menu";
import styles from "./MenuList.module.css";
import { useCart } from "../cart/CartContext";
import { buildCartKey } from "../cart/CartReducer";
import CustomizationModal from "./CustomizationModal";

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonContent}>
      <div className={`${styles.skeletonLine} ${styles.skeletonLineTitle}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineDesc}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineDesc}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLinePrice}`} />
    </div>
  </div>
);

const MenuList = () => {
  const { state, dispatch } = useCart();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    let firstLoad = true;

    const load = async () => {
      try {
        const data = await fetchMenu();
        if (!mounted) return;
        setMenu((prev) => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(data);
          return prevStr !== nextStr ? data : prev;
        });
      } catch (err) {
        console.error("Menu fetch error:", err);
      } finally {
        if (mounted && firstLoad) {
          firstLoad = false;
          setLoading(false);
        }
      }
    };

    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleAddClick = (item) => {
    if (item.available === false) return;

    if (item.modifiers?.length) {
      setSelectedItem(item);
    } else {
      const cartKey = buildCartKey({ id: item.id, selectedOptions: [], notes: "" });
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          qty: 1,
          notes: "",
          selectedOptions: [],
          cartKey,
        },
      });
    }
  };

  const handleDecrement = (cartKey) => {
    dispatch({ type: "REMOVE_ITEM", payload: { cartKey } });
  };

  return (
    <>
      <section className={styles.list}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : menu.map((item) => {
              const hasModifiers = Boolean(item.modifiers?.length);

              if (hasModifiers) {
                const cartEntries = state.items.filter((i) => i.id === item.id);
                const totalQty = cartEntries.reduce((sum, i) => sum + i.qty, 0);
                // decrement the most recently added variant
                const lastEntry = cartEntries[cartEntries.length - 1];

                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onAdd={() => handleAddClick(item)}
                    onDecrement={lastEntry ? () => handleDecrement(lastEntry.cartKey) : undefined}
                    totalQty={totalQty}
                  />
                );
              }

              const cartKey = buildCartKey({ id: item.id, selectedOptions: [], notes: "" });
              const cartItem = state.items.find((i) => i.cartKey === cartKey);
              const totalQty = cartItem?.qty || 0;

              return (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAdd={() => handleAddClick(item)}
                  onDecrement={totalQty > 0 ? () => handleDecrement(cartKey) : undefined}
                  totalQty={totalQty}
                />
              );
            })}
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
