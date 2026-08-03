-- Adds 'cancelled' as a valid `orders.status` value so staff can cancel an
-- order from the admin dashboard without deleting the row (keeps the record
-- for reporting/audit — the delete button in the UI is a soft delete).
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -it mysql-igokochi-0 -- mysql -uigokochi_user -p igokochi < igokochi_backend/migrations/005_add_cancelled_order_status.sql
--   (enter the password interactively when prompted — never inline it here)

ALTER TABLE orders
  MODIFY COLUMN status ENUM('new','paid','ready','done','cancelled') NOT NULL DEFAULT 'new';
