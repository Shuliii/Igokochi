// src/components/checkout/PickupTimeSlots.jsx
import styles from "./PickupTimeSlots.module.css";
import {
  isSlotInPast,
  makeHourlySlotsForDate,
  parseYmd,
} from "../utils/pickupTime";

const PickupTimeSlots = ({selectedDay, selectedSlot, onSelectSlot}) => {
  const selectedDateObj = selectedDay ? parseYmd(selectedDay) : null;
  const slots = makeHourlySlotsForDate(selectedDateObj);

  return (
    <div className={styles.wrap}>
      <div className={styles.subtitle}>Choose time</div>

      {!selectedDateObj ? (
        <div className={styles.helperText}>Select a day first</div>
      ) : slots.length === 0 ? (
        <div className={styles.helperText}>No slots available</div>
      ) : (
        <div className={styles.list}>
          {slots.map((slot) => {
            const active = slot.value === selectedSlot;
            const disabled = isSlotInPast(selectedDateObj, slot);

            return (
              <button
                key={slot.value}
                type="button"
                disabled={disabled}
                className={`${styles.slotBtn} ${active ? styles.slotBtnActive : ""}`}
                onClick={() => onSelectSlot(slot.value)}
              >
                {slot.label}
                {disabled ? " (unavailable)" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PickupTimeSlots;
