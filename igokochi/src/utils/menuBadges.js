// Labels the admin can put on a menu item. Keep ids in sync with
// ALLOWED_BADGES in igokochi_backend/src/server.js.
export const MENU_BADGES = [
  { id: "new", label: "New" },
  { id: "must-try", label: "Must try!" },
  { id: "bestseller", label: "Bestseller" },
  { id: "limited", label: "Limited" },
];

export const findBadge = (id) => MENU_BADGES.find((b) => b.id === id) || null;
