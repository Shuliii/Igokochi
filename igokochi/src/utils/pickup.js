// src/utils/pickupTime.js
import {PICKUP_HOURS_BY_DAY} from "../data/pickupData";

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

/**
 * Allowed pickup days: Fri (5), Sat (6), Sun (0)
 */
export function isPickupDay(date) {
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0;
}

/**
 * Disable slot if the slot start time is already in the past (local device time).
 * selectedDateObj should be midnight of the chosen day (parseYmd output).
 * slot should have { startHour, endHour }.
 */
export function isSlotInPast(selectedDateObj, slot) {
  const now = new Date();
  const slotStart = new Date(selectedDateObj);
  slotStart.setHours(slot.startHour, 0, 0, 0);
  return slotStart <= now;
}

/**
 * Generate 1-hour pickup slots for a given selected date, based on:
 * Fri: 18–21, Sat: 11–21, Sun: 11–21 (from PICKUP_HOURS_BY_DAY)
 *
 * Returns:
 * [
 *   { startHour: 18, endHour: 19, label: "6pm–7pm", value: "18:00-19:00" },
 *   ...
 * ]
 */
export function makeHourlySlotsForDate(selectedDateObj) {
  if (!selectedDateObj) return [];

  const day = selectedDateObj.getDay(); // 0 Sun, 5 Fri, 6 Sat
  const hours = PICKUP_HOURS_BY_DAY[day];
  if (!hours) return [];

  const slots = [];
  for (let h = hours.startHour; h < hours.endHour; h++) {
    slots.push({
      startHour: h,
      endHour: h + 1,
      label: formatHourRangeLabel(h, h + 1),
      value: `${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(
        2,
        "0",
      )}:00`,
    });
  }
  return slots;
}

/* ---------------- Helpers (internal) ---------------- */

function formatHourRangeLabel(startHour, endHour) {
  return `${to12(startHour)}–${to12(endHour)}`;
}

function to12(h) {
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}${suffix}`;
}
