// src/components/admin/MenuList.jsx

import styles from "./MenuList.module.css";

const MenuSkeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonContent}>
      <div className={`${styles.skeletonLine} ${styles.skeletonName}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonPrice}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
    </div>
    <div className={`${styles.skeletonLine} ${styles.skeletonToggle}`} />
  </div>
);

const MenuList = ({ menu, onToggle, loading }) => {
  if (loading) {
    return (
      <section className={styles.list}>
        {Array.from({ length: 5 }, (_, i) => <MenuSkeleton key={i} />)}
      </section>
    );
  }

  return (
    <section className={styles.list}>
      {menu.map((item) => {
        const available = item.available !== false;
        const imageSrc = item.image_path ? `/assets/${item.image_path}` : null;

        return (
          <article key={item.id} className={styles.card}>
            {imageSrc && (
              <img src={imageSrc} alt={item.name} className={styles.thumb} />
            )}

            <div className={styles.info}>
              <h3 className={styles.name}>{item.name}</h3>
              <p className={styles.price}>${Number(item.price).toFixed(2)}</p>
              <span className={`${styles.badge} ${available ? styles.available : styles.soldOut}`}>
                {available ? "Available" : "Sold out"}
              </span>
            </div>

            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={available}
                onChange={() => onToggle(item)}
              />
              <span className={styles.slider} />
            </label>
          </article>
        );
      })}
    </section>
  );
};

export default MenuList;
