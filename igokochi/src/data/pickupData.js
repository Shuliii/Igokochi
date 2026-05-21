export const PICKUP_HOURS_BY_DAY = {
  5: { startHour: 19, endHour: 21 }, // Fri 7pm–9pm
  6: { startHour: 11, endHour: 17 }, // Sat 11am–5pm
  0: { startHour: 11, endHour: 17 }, // Sun 11am–5pm
};

export const EXTRA_PICKUP_HOURS_BY_DATE = {
  "2026-05-27": { startHour: 11, endHour: 17 }, // Wed only
  "2026-05-28": { startHour: 11, endHour: 17 }, // Thu only
};

export const CLOSED_PICKUP_DATES = [
  "2026-05-22",
  "2026-05-29",
  "2026-05-30",
  "2026-06-19",
];
