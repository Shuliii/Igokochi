import {db} from "../db.js";
import {OrderValidationError} from "./verifyOrderItems.js";

export async function getActivePromo(code) {
  if (!code) return null;

  const [rows] = await db.query(
    `SELECT * FROM promo_codes WHERE code = ? AND active = 1 AND expires_at > NOW() LIMIT 1`,
    [code],
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    code: row.code,
    type: row.type,
    rules: typeof row.rules === "string" ? JSON.parse(row.rules) : row.rules,
  };
}

// Looks up a promo code and throws if it was supplied but is invalid/expired.
// Returns null if no code was supplied at all (no promo applied).
export async function resolvePromo(code) {
  if (!code) return null;

  const promo = await getActivePromo(String(code).trim().toUpperCase());

  if (!promo) {
    const err = new OrderValidationError("Promo code is no longer valid");
    err.promoInvalid = true;
    throw err;
  }

  return promo;
}

const noDiscount = (verifiedItems) =>
  verifiedItems.map((item) => ({
    cartKey: item.cartKey,
    originalPrice: item.price,
    discountedPrice: item.price,
    discounted: false,
  }));

export function applyPromoToItems(promo, verifiedItems) {
  const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (!promo) {
    return {
      total: Number(subtotal.toFixed(2)),
      discountAmount: 0,
      itemDiscounts: noDiscount(verifiedItems),
    };
  }

  if (promo.type === "percent_off") {
    const percent = Number(promo.rules.percent) || 0;
    const total = subtotal * (1 - percent / 100);

    const itemDiscounts = verifiedItems.map((item) => ({
      cartKey: item.cartKey,
      originalPrice: item.price,
      discountedPrice: Number((item.price * (1 - percent / 100)).toFixed(2)),
      discounted: percent > 0,
    }));

    return {
      total: Number(total.toFixed(2)),
      discountAmount: Number((subtotal - total).toFixed(2)),
      itemDiscounts,
    };
  }

  if (promo.type === "fixed_price") {
    const fixedPrice = Number(promo.rules.price);
    const categories =
      promo.rules.categories ?? (promo.rules.category ? [promo.rules.category] : null);

    // Caps price at fixedPrice, never raises it — an item (with modifiers)
    // already priced below fixedPrice is left alone rather than bumped up.
    let total = 0;
    const itemDiscounts = [];

    for (const item of verifiedItems) {
      const inCategory = !categories || categories.includes(item.category);
      const unitPrice = inCategory ? Math.min(fixedPrice, item.price) : item.price;
      total += unitPrice * item.qty;

      itemDiscounts.push({
        cartKey: item.cartKey,
        originalPrice: item.price,
        discountedPrice: unitPrice,
        discounted: inCategory && unitPrice < item.price,
      });
    }

    return {
      total: Number(total.toFixed(2)),
      discountAmount: Number((subtotal - total).toFixed(2)),
      itemDiscounts,
    };
  }

  return {
    total: Number(subtotal.toFixed(2)),
    discountAmount: 0,
    itemDiscounts: noDiscount(verifiedItems),
  };
}
