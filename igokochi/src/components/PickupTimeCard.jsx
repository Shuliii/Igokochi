// src/components/checkout/PickupTimeCard.jsx
import {useMemo, useState, useEffect} from "react";
import styles from "./PickupTimeCard.module.css";

import PickupCalendar from "./PickupCalendar";
import PickupTimeSlots from "./PickupTimeSlots";

import {getTodayMidnight, toYmd} from "../utils/pickup";

const PickupTimeCard = ({value, onChange}) => {
  const today = useMemo(() => getTodayMidnight(), []);
  const defaultDay = toYmd(today);

  const [selectedDay, setSelectedDay] = useState(value?.date || defaultDay);
  const [selectedSlot, setSelectedSlot] = useState(value?.slot || null);

  useEffect(() => {
    setSelectedDay(value?.date || defaultDay);
    setSelectedSlot(value?.slot || null);
  }, [value?.date, value?.slot, defaultDay]);

  const handleDaySelect = (ymd) => {
    setSelectedDay(ymd);
    setSelectedSlot(null);
    onChange?.({date: ymd, slot: null});
  };

  const handleSlotSelect = (slotValue) => {
    setSelectedSlot(slotValue);
    onChange?.({date: selectedDay, slot: slotValue});
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Pickup Time</h3>

      <div className={styles.calendarWrap}>
        <PickupCalendar
          selectedDay={selectedDay}
          onSelectDay={handleDaySelect}
        />
      </div>

      <div className={styles.slotsWrap}>
        <PickupTimeSlots
          selectedDay={selectedDay}
          selectedSlot={selectedSlot}
          onSelectSlot={handleSlotSelect}
        />
      </div>
    </div>
  );
};

export default PickupTimeCard;
