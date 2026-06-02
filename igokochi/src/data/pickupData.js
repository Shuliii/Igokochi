// Static fallback — kept for reference, now managed via DB
// export const PICKUP_HOURS_BY_DAY = {
//   5: {startHour: 19, endHour: 21}, // Fri 7pm–9pm
//   6: {startHour: 11, endHour: 17}, // Sat 11am–5pm
//   0: {startHour: 11, endHour: 17}, // Sun 11am–5pm
// };

// export const EXTRA_PICKUP_HOURS_BY_DATE = {
//   "2026-05-27": {startHour: 11, endHour: 17}, // Wed only
//   "2026-05-28": {startHour: 11, endHour: 17}, // Thu only
// };

// export const CLOSED_PICKUP_DATES = ["2026-06-06", "2026-06-19"];

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

export async function fetchSchedule() {
  const res = await fetch(`${API_BASE}/schedule`);
  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.message || "Failed to fetch schedule");
  }

  // Transform DB rows back into the shape pickup.js utilities expect
  const PICKUP_HOURS_BY_DAY = {};
  const EXTRA_PICKUP_HOURS_BY_DATE = {};
  const CLOSED_PICKUP_DATES = [];

  for (const row of data.weekly) {
    if (row.enabled) {
      PICKUP_HOURS_BY_DAY[row.day_of_week] = {
        startHour: row.start_hour,
        endHour: row.end_hour,
      };
    }
  }

  for (const row of data.overrides) {
    if (row.type === "open") {
      EXTRA_PICKUP_HOURS_BY_DATE[row.date] = {
        startHour: row.start_hour,
        endHour: row.end_hour,
      };
    } else {
      CLOSED_PICKUP_DATES.push(row.date);
    }
  }

  return {
    PICKUP_HOURS_BY_DAY,
    EXTRA_PICKUP_HOURS_BY_DATE,
    CLOSED_PICKUP_DATES,
  };
}
