// src/components/checkout/PickupTimeSlots.jsx
import styles from "./PickupTimeSlots.module.css";
import {isSlotInPast, makeHourlySlotsForDate, parseYmd} from "../utils/pickup";

const SLOT_CAPACITY = 2;

const PickupTimeSlots = ({selectedDay, selectedSlot, onSelectSlot, schedule, bookedCounts = {}}) => {
  const selectedDateObj = selectedDay ? parseYmd(selectedDay) : null;
  const slots = makeHourlySlotsForDate(selectedDateObj, schedule);

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
            const full = (bookedCounts[slot.value] ?? 0) >= SLOT_CAPACITY;
            const disabled = isSlotInPast(selectedDateObj, slot) || full;

            return (
              <button
                key={slot.value}
                type="button"
                disabled={disabled}
                className={`${styles.slotBtn} ${active ? styles.slotBtnActive : ""} ${full ? styles.slotBtnFull : ""}`}
                onClick={() => onSelectSlot(slot.value)}
              >
                {slot.label}{full ? " · Full" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PickupTimeSlots;
