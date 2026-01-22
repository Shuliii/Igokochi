// src/components/checkout/PickupTimeCard.jsx
import styles from "./PickupTimeCard.module.css";
import PickupCalendar from "./PickupCalendar";
import PickupTimeSlots from "./PickupTimeSlots";

const PickupTimeCard = () => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Pickup Time</h3>

      <div className={styles.content}>
        <div className={styles.left}>
          <PickupCalendar />
        </div>

        <div className={styles.right}>
          <PickupTimeSlots />
        </div>
      </div>
    </div>
  );
};

export default PickupTimeCard;
