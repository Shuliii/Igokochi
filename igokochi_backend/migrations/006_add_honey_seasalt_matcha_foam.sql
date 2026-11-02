-- Adds Honey Seasalt Matcha Foam as the first menu item and shifts every
-- other non-bundle item down by one (bundles keep their 100+ sort_order).
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -it mysql-igokochi-0 -- mysql -uigokochi_user -p igokochi < igokochi_backend/migrations/006_add_honey_seasalt_matcha_foam.sql
--   (enter the password interactively when prompted — never inline it here)

START TRANSACTION;

UPDATE menu_items_table
SET sort_order = sort_order + 1
WHERE category <> 'bundle';

INSERT INTO menu_items_table
  (id, name, description, price, image_path, available, modifiers, sort_order, category)
VALUES (
  'honey-seasalt-matcha-foam',
  'Honey Seasalt Matcha Foam',
  'Velvety honey sea salt foam over a smooth matcha latte. Sweet, a little salty, and impossible to put down.',
  6.50,
  'Honey-Seasalt-Matcha-Foam.JPG',
  0,
  '[{"id": "milk", "name": "Milk", "type": "single", "options": [{"id": "normal", "name": "Normal Milk", "default": true, "priceDelta": 0}, {"id": "oat", "name": "Oat Milk", "priceDelta": 1.0}], "required": true}]',
  1,
  'matcha'
);

COMMIT;
