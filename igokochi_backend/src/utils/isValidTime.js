export function isValidTime(str) {
  return typeof str === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}