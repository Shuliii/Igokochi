-- Seeds the HUAT500 promo code into promo_codes (table already exists).
--
-- HUAT500: every matcha- or dessert-category item is capped at $5 (price is
--          never raised, only lowered) via applyPromo.js's Math.min(fixedPrice,
--          item.price) logic. matcha-latte (base $4.50) is naturally left
--          alone since it's already under $5, but matcha-latte + a paid
--          modifier (e.g. + oat milk = $5.50) still gets capped down to $5.
--
-- Expires 2026-08-03 00:00:00 Singapore time (UTC+8) = 2026-08-02 16:00:00 UTC.
-- The DB server runs in UTC (NOW() == UTC_TIMESTAMP()), so expires_at is
-- stored/compared in UTC.
--
-- How to run against production (StatefulSet pod mysql-igokochi-0):
--   kubectl exec -i mysql-igokochi-0 -- mysql -uigokochi_user -pigokochi_pass1234 igokochi < igokochi_backend/migrations/004_seed_huat500_promo.sql

INSERT INTO promo_codes (code, type, rules, expires_at, active) VALUES
('HUAT500', 'fixed_price', '{"price": 5, "categories": ["matcha", "dessert"]}', '2026-08-02 16:00:00', 1);
