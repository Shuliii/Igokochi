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
      <div className={`${styles.skeletonLine} ${styles.skeletonLinePrice}`} />
    </div>
  </div>
);

const CATEGORY_LABELS = {
  matcha: { title: "Matcha", jp: "抹茶" },
  dessert: { title: "Sweets", jp: "甘味" },
};

// group by category, keeping the menu's sort_order within and across groups
const groupByCategory = (menu) => {
  const groups = [];
  for (const item of menu) {
    const key = item.category || "other";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
};

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

  const renderCard = (item) => {
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
  };

  return (
    <>
      {loading ? (
        <section className={styles.group}>
          <div className={styles.list}>
            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      ) : (
        groupByCategory(menu).map((group) => {
          const label = CATEGORY_LABELS[group.key] || { title: group.key };
          return (
            <section key={group.key} className={styles.group}>
              <h2 className={styles.groupTitle}>
                {label.title}
                {label.jp && <span className={styles.groupJp}>{label.jp}</span>}
              </h2>
              <div className={styles.list}>{group.items.map(renderCard)}</div>
            </section>
          );
        })
      )}

      <CustomizationModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default MenuList;
