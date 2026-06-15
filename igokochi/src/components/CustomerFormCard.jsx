// src/components/checkout/CustomerFormCard.jsx
import {useState} from "react";
import styles from "./CustomerFormCard.module.css";

const PHONE_RE = /^[89]\d{7}$/;

const CustomerFormCard = ({value = {}, onChange}) => {
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handleChange = (field) => (e) => {
    onChange?.({
      ...value,
      [field]: e.target.value,
    });
  };

  const phoneValid = PHONE_RE.test(value.phone || "");
  const showPhoneError = phoneTouched && !phoneValid;

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
          className={`${styles.input} ${showPhoneError ? styles.inputError : ""}`}
          placeholder="e.g. 91234567"
          value={value.phone || ""}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
            handleChange("phone")({target: {value: digitsOnly}});
          }}
          onBlur={() => setPhoneTouched(true)}
        />
        {showPhoneError && (
          <span className={styles.errorMsg}>Please enter valid number</span>
        )}
      </div>
    </div>
  );
};

export default CustomerFormCard;
