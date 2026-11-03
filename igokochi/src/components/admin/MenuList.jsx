// src/components/admin/MenuList.jsx

import styles from "./MenuList.module.css";
import { menuImageUrl } from "../../utils/menuImage";
import { MENU_BADGES } from "../../utils/menuBadges";

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

const MenuList = ({ menu, onToggle, onBadgeChange, loading }) => {
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
        const imageSrc = menuImageUrl(item.image_path);

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

            <div className={styles.labelRow} role="group" aria-label="Menu label">
              {[{ id: null, label: "No label" }, ...MENU_BADGES].map((b) => {
                const active = (item.badge || null) === b.id;
                return (
                  <button
                    key={b.id || "none"}
                    type="button"
                    className={`${styles.labelChip} ${active ? styles.labelChipActive : ""}`}
                    aria-pressed={active}
                    onClick={() => !active && onBadgeChange(item, b.id)}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default MenuList;
