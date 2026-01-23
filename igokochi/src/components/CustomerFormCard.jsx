// src/components/checkout/CustomerFormCard.jsx
import styles from "./CustomerFormCard.module.css";

const CustomerFormCard = ({value = {}, onChange}) => {
  const handleChange = (field) => (e) => {
    onChange?.({
      ...value,
      [field]: e.target.value,
    });
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Your details</h3>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          className={styles.input}
          placeholder="e.g. Alex"
          value={value.name || ""}
          onChange={handleChange("name")}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className={styles.input}
          placeholder="e.g. 91234567"
          value={value.phone || ""}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
            handleChange("phone")({
              target: {value: digitsOnly},
            });
          }}
        />
      </div>
    </div>
  );
};

export default CustomerFormCard;
