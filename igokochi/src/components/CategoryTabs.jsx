import styles from "./CategoryTabs.module.css";

const CATEGORIES = [
  { id: "bundle", label: "Bundle" },
  { id: "matcha", label: "Matcha" },
  { id: "dessert", label: "Dessert" },
];

const CategoryTabs = ({ active, onChange }) => {
  return (
    <div className={styles.wrap}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`${styles.tab} ${active === cat.id ? styles.active : ""}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
