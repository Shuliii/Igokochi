export function getUpcomingPickupDays(daysAhead = 14) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const day = d.getDay(); // 0 Sun, 5 Fri, 6 Sat
    if (day === 5 || day === 6 || day === 0 || day === 4) {
      result.push(d);
    }
  }

  return result;
}

export function formatDateLabel(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function toYmd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function isSlotInPast(selectedDate, slot) {
  const now = new Date();
  const slotStart = new Date(selectedDate);
  slotStart.setHours(slot.startHour, 0, 0, 0);
  return slotStart <= now;
}
