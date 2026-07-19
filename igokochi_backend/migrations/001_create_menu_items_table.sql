-- Creates `menu_items_table` as a full copy of `menu_items` (same columns,
-- keys, indexes, auto_increment) plus a new `category` column, and backfills
-- it with a snapshot of current production data.
--
-- This is a PARALLEL table, not a replacement: the currently-deployed backend
-- keeps reading/writing `menu_items` untouched. Only the new dev backend
-- (built from this branch, running on its own pod behind dev.igokochihouse.com)
-- reads/writes `menu_items_table`. Once that's tested and cut over to
-- production, `menu_items` becomes unused and can be dropped.
--
-- Re-run the INSERT step (after TRUNCATE) right before cutover to refresh the
-- snapshot with the latest prod data (e.g. availability toggles made during
-- testing), since this is a one-time copy, not a live sync.
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -i mysql-igokochi-0 -- mysql -uigokochi_user -pigokochi_pass1234 igokochi < igokochi_backend/migrations/001_create_menu_items_table.sql

CREATE TABLE menu_items_table LIKE menu_items;

ALTER TABLE menu_items_table
  ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'matcha';

-- Positional copy: works regardless of the exact original column list,
-- since `category` was appended at the end to match `SELECT *, 'matcha'`.
INSERT INTO menu_items_table
SELECT *, 'matcha' FROM menu_items;
