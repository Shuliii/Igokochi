const PHONE_RE = /^[89]\d{7}$/;

// All 7 digits after the leading 8/9 are the same (keyboard-mashed, e.g. 80000000, 91111111)
const REPEATED_TRAILING_DIGITS_RE = /^[89](\d)\1{6}$/;

// Other obviously fake numbers people type to get through the form
const BLOCKED_NUMBERS = new Set(["81234567", "91234567", "87654321", "97654321"]);

export function isValidPhone(phone) {
  const value = phone || "";
  return (
    PHONE_RE.test(value) &&
    !REPEATED_TRAILING_DIGITS_RE.test(value) &&
    !BLOCKED_NUMBERS.has(value)
  );
}