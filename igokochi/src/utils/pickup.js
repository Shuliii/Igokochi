// src/utils/pickupTime.js

/** Convert Date -> "YYYY-MM-DD" */
export function toYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert "YYYY-MM-DD" -> Date (at 00:00 local time) */
export function parseYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Format a Date into a nice label like "Fri, Jan 23" */
export function formatDateLabel(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Today at midnight (local device time) */
export function getTodayMidnight() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function isPickupDay(date, schedule) {
  const {PICKUP_HOURS_BY_DAY, EXTRA_PICKUP_HOURS_BY_DATE, CLOSED_PICKUP_DATES} = schedule;
  const ymd = toYmd(date);

  if (CLOSED_PICKUP_DATES.includes(ymd)) return false;
  if (EXTRA_PICKUP_HOURS_BY_DATE[ymd]) return true;

  const day = date.getDay();
  return Boolean(PICKUP_HOURS_BY_DAY[day]);
}

export function isSlotInPast(selectedDateObj, slot) {
  const now = new Date();
  const slotStart = new Date(selectedDateObj);
  slotStart.setHours(slot.hour, slot.minute, 0, 0);
  return slotStart <= now;
}

export function makeHourlySlotsForDate(selectedDateObj, schedule) {
  if (!selectedDateObj) return [];

  const {PICKUP_HOURS_BY_DAY, EXTRA_PICKUP_HOURS_BY_DATE} = schedule;
  const ymd = toYmd(selectedDateObj);
  const day = selectedDateObj.getDay();

  const hours = EXTRA_PICKUP_HOURS_BY_DATE[ymd] || PICKUP_HOURS_BY_DAY[day];

  if (!hours) return [];

  const slots = [];

  for (let h = hours.startHour; h <= hours.endHour; h++) {
    slots.push({
      hour: h,
      minute: 0,
      label: formatTimeLabel(h, 0),
      value: formatTimeValue(h, 0),
    });

    if (h !== hours.endHour) {
      slots.push({
        hour: h,
        minute: 30,
        label: formatTimeLabel(h, 30),
        value: formatTimeValue(h, 30),
      });
    }
  }

  return slots;
}

function formatTimeLabel(hour, minute) {
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = ((hour + 11) % 12) + 1;

  const minuteStr = String(minute).padStart(2, "0");

  return `${hour12}.${minuteStr}${suffix}`;
}

function formatTimeValue(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
