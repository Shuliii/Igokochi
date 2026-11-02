-- Replaces the placeholder description for Honey Seasalt Matcha Foam.
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -it mysql-igokochi-0 -- mysql -uigokochi_user -p igokochi < igokochi_backend/migrations/007_update_honey_seasalt_description.sql
--   (enter the password interactively when prompted — never inline it here)

UPDATE menu_items_table
SET description = 'Topped with a creamy honey seasalt foam, this matcha latte brings together a gentle sweetness with a hint of savouriness.'
WHERE id = 'honey-seasalt-matcha-foam';
