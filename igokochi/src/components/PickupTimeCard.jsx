import { useMemo, useState, useEffect } from "react";
import styles from "./PickupTimeCard.module.css";

import PickupCalendar from "./PickupCalendar";
import PickupTimeSlots from "./PickupTimeSlots";

import { getTodayMidnight, toYmd, isPickupDay, parseYmd } from "../utils/pickup";
import { useSchedule } from "../hooks/useSchedule";

const PickupTimeCard = ({ value, onChange }) => {
  const {schedule, loading, error} = useSchedule();
  const today = useMemo(() => getTodayMidnight(), []);
  const defaultDay = toYmd(today);

  const [selectedDay, setSelectedDay] = useState(value?.date || defaultDay);
  const [selectedSlot, setSelectedSlot] = useState(value?.slot || null);

  useEffect(() => {
    setSelectedDay(value?.date || defaultDay);
    setSelectedSlot(value?.slot || null);
  }, [value?.date, value?.slot, defaultDay]);

  // Once schedule loads, clear the pre-selected day if it turned out to be closed
  useEffect(() => {
    if (loading) return;
    if (!selectedDay) return;
    const date = parseYmd(selectedDay);
    if (!isPickupDay(date, schedule)) {
      setSelectedDay(null);
      setSelectedSlot(null);
    }
  }, [loading, schedule]);

  const handleDaySelect = (ymd) => {
    setSelectedDay(ymd);
    setSelectedSlot(null);
    onChange?.({ date: ymd, slot: null });
  };

  const handleSlotSelect = (slotValue) => {
    setSelectedSlot(slotValue);
    onChange?.({ date: selectedDay, slot: slotValue });
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Pickup Time</h3>

      {error ? (
        <p className={styles.statusMsg}>Could not load pickup times. Please refresh.</p>
      ) : loading ? (
        <p className={styles.statusMsg}>Loading availability…</p>
      ) : (
        <>
          <div className={styles.calendarWrap}>
            <PickupCalendar
              selectedDay={selectedDay}
              onSelectDay={handleDaySelect}
              schedule={schedule}
            />
          </div>

          <div className={styles.slotsWrap}>
            <PickupTimeSlots
              selectedDay={selectedDay}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
              schedule={schedule}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PickupTimeCard;
