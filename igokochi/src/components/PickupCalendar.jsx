// src/components/checkout/PickupCalendar.jsx
import {useMemo, useState} from "react";
import styles from "./PickupCalendar.module.css";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {getTodayMidnight, isPickupDay, toYmd} from "../utils/pickup";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PickupCalendar = ({selectedDay, onSelectDay}) => {
  const today = useMemo(() => getTodayMidnight(), []);

  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const monthLabel = useMemo(() => {
    const d = new Date(view.year, view.month, 1);
    return d.toLocaleDateString(undefined, {month: "long", year: "numeric"});
  }, [view.year, view.month]);

  const days = useMemo(() => {
    const firstDay = new Date(view.year, view.month, 1);
    const lastDay = new Date(view.year, view.month + 1, 0);

    const arr = [];

    for (let i = 0; i < firstDay.getDay(); i++) arr.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      arr.push(new Date(view.year, view.month, d));
    }

    return arr;
  }, [view.year, view.month]);

  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const viewMonthKey = view.year * 12 + view.month;
  const canGoPrev = viewMonthKey > currentMonthKey;

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    setView((v) => {
      const d = new Date(v.year, v.month - 1, 1);
      return {year: d.getFullYear(), month: d.getMonth()};
    });
  };

  const goNextMonth = () => {
    setView((v) => {
      const d = new Date(v.year, v.month + 1, 1);
      return {year: d.getFullYear(), month: d.getMonth()};
    });
  };

  const isAllowed = (date) => {
    if (!date) return false;
    const notPast = date >= today;
    return notPast && isPickupDay(date);
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={`${styles.navBtn} ${!canGoPrev ? styles.navBtnDisabled : ""}`}
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>

        <div className={styles.month}>{monthLabel}</div>

        <button
          type="button"
          className={styles.navBtn}
          onClick={goNextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className={styles.weekdays}>
        {DAYS.map((d) => (
          <div key={d} className={styles.weekday}>
            {d}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;

          const ymd = toYmd(date);
          const active = ymd === selectedDay;
          const allowed = isAllowed(date);

          return (
            <button
              key={ymd}
              type="button"
              disabled={!allowed}
              className={`${styles.day} ${active ? styles.active : ""} ${
                allowed ? styles.dayEnabled : styles.dayDisabled
              }`}
              onClick={() => onSelectDay(ymd)}
              aria-label={`Select ${date.toDateString()}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PickupCalendar;
