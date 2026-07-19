-- Seeds 3 "bundle" category items into menu_items_table (the parallel dev
-- table — see 001_create_menu_items_table.sql). Each bundle lets the
-- customer pick which matcha flavor to pair with the cookie via the
-- "Matcha" modifier, plus the standard Milk/Sugar modifiers.
--
-- Placeholder names/descriptions/image — update later once real cookie
-- flavors + photos are decided:
--   UPDATE menu_items_table SET name = '...', description = '...', image_path = '...' WHERE id = '<id>';
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -i mysql-igokochi-0 -- mysql -uigokochi_user -pigokochi_pass1234 igokochi < igokochi_backend/migrations/002_seed_bundle_items.sql

INSERT INTO menu_items_table
  (id, name, description, price, image_path, available, modifiers, sort_order, category)
VALUES
(
  'matcha-cookie-1',
  'Matcha + Cookie 1',
  'Placeholder bundle — pick your matcha latte, paired with a cookie from our collab partner.',
  '8.50',
  NULL,
  '1',
  '[{"id": "matcha", "name": "Matcha", "type": "single", "required": true, "options": [{"id": "matcha_latte", "name": "Matcha Latte", "default": true, "priceDelta": 0}, {"id": "earl_grey", "name": "Earl Grey Matcha Latte", "priceDelta": 0.5}, {"id": "strawberry", "name": "Strawberry Matcha Latte", "priceDelta": 2}, {"id": "mango", "name": "Mango Matcha Latte", "priceDelta": 2}]}, {"id": "milk", "name": "Milk", "type": "single", "options": [{"id": "normal", "name": "Normal Milk", "default": true, "priceDelta": 0}, {"id": "oat", "name": "Oat Milk", "priceDelta": 1.0}], "required": true}, {"id": "sugar", "name": "Sugar", "type": "single", "options": [{"id": "No", "name": "Less Sugar", "priceDelta": 0}, {"id": "normal", "name": "Normal Sugar", "default": true, "priceDelta": 0}, {"id": "more", "name": "More Sugar", "priceDelta": 0}], "required": true}]',
  '100',
  'bundle'
),
(
  'matcha-cookie-2',
  'Matcha + Cookie 2',
  'Placeholder bundle — pick your matcha latte, paired with a cookie from our collab partner.',
  '9.00',
  NULL,
  '1',
  '[{"id": "matcha", "name": "Matcha", "type": "single", "required": true, "options": [{"id": "matcha_latte", "name": "Matcha Latte", "default": true, "priceDelta": 0}, {"id": "earl_grey", "name": "Earl Grey Matcha Latte", "priceDelta": 0.5}, {"id": "strawberry", "name": "Strawberry Matcha Latte", "priceDelta": 2}, {"id": "mango", "name": "Mango Matcha Latte", "priceDelta": 2}]}, {"id": "milk", "name": "Milk", "type": "single", "options": [{"id": "normal", "name": "Normal Milk", "default": true, "priceDelta": 0}, {"id": "oat", "name": "Oat Milk", "priceDelta": 1.0}], "required": true}, {"id": "sugar", "name": "Sugar", "type": "single", "options": [{"id": "No", "name": "Less Sugar", "priceDelta": 0}, {"id": "normal", "name": "Normal Sugar", "default": true, "priceDelta": 0}, {"id": "more", "name": "More Sugar", "priceDelta": 0}], "required": true}]',
  '101',
  'bundle'
),
(
  'matcha-cookie-3',
  'Matcha + Cookie 3',
  'Placeholder bundle — pick your matcha latte, paired with a cookie from our collab partner.',
  '10.00',
  NULL,
  '1',
  '[{"id": "matcha", "name": "Matcha", "type": "single", "required": true, "options": [{"id": "matcha_latte", "name": "Matcha Latte", "default": true, "priceDelta": 0}, {"id": "earl_grey", "name": "Earl Grey Matcha Latte", "priceDelta": 0.5}, {"id": "strawberry", "name": "Strawberry Matcha Latte", "priceDelta": 2}, {"id": "mango", "name": "Mango Matcha Latte", "priceDelta": 2}]}, {"id": "milk", "name": "Milk", "type": "single", "options": [{"id": "normal", "name": "Normal Milk", "default": true, "priceDelta": 0}, {"id": "oat", "name": "Oat Milk", "priceDelta": 1.0}], "required": true}, {"id": "sugar", "name": "Sugar", "type": "single", "options": [{"id": "No", "name": "Less Sugar", "priceDelta": 0}, {"id": "normal", "name": "Normal Sugar", "default": true, "priceDelta": 0}, {"id": "more", "name": "More Sugar", "priceDelta": 0}], "required": true}]',
  '102',
  'bundle'
);
