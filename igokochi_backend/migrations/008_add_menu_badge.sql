-- Adds an optional promo label to menu items ("new", "must-try", "bestseller",
-- "limited"; NULL = no label). Additive: the currently deployed frontend and
-- backend ignore the extra column, so this is safe to run before deploying.
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -it mysql-igokochi-0 -- mysql -uigokochi_user -p igokochi < igokochi_backend/migrations/008_add_menu_badge.sql
--   (enter the password interactively when prompted — never inline it here)

ALTER TABLE menu_items_table
  ADD COLUMN badge VARCHAR(20) NULL DEFAULT NULL;
