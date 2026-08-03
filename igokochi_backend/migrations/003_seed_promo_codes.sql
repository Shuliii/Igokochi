-- Seeds 2 promo codes into promo_codes (table already created by you).
-- Both active for 1 week from whenever this script actually runs.
--
-- OFF25: 25% off the whole order.
-- ALL5:  every matcha-category item in the cart gets its price overridden
--        to $5 (desserts/bundles are unaffected).
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -it mysql-igokochi-0 -- mysql -uigokochi_user -p igokochi < igokochi_backend/migrations/003_seed_promo_codes.sql
--   (enter the password interactively when prompted — never inline it here)

INSERT INTO promo_codes (code, type, rules, expires_at, active) VALUES
('OFF25', 'percent_off', '{"percent": 25}', DATE_ADD(NOW(), INTERVAL 7 DAY), 1),
('ALL5', 'fixed_price', '{"price": 5, "category": "matcha"}', DATE_ADD(NOW(), INTERVAL 7 DAY), 1);
