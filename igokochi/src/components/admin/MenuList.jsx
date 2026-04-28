// src/components/admin/MenuList.jsx

import styles from "./MenuList.module.css";

const MenuList = ({ menu, onToggle }) => {
  if (!menu.length) {
    return <div className={styles.empty}>No menu items</div>;
  }

  return (
    <section className={styles.list}>
      {menu.map((item) => {
        const available = item.available !== false;

        return (
          <article key={item.id} className={styles.card}>
            <div className={styles.info}>
              <h3>{item.name}</h3>
              <p>${Number(item.price).toFixed(2)}</p>

              <span className={available ? styles.available : styles.soldOut}>
                {available ? "Available" : "Sold out"}
              </span>
            </div>

            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={available}
                onChange={() => onToggle(item)}
              />
              <span className={styles.slider}></span>
            </label>
          </article>
        );
      })}
    </section>
  );
};

export default MenuList;
