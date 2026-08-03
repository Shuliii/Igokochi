import express from "express";
import {getActivePromo, applyPromoToItems} from "../utils/applyPromo.js";
import {verifyOrderItems, OrderValidationError} from "../utils/verifyOrderItems.js";
import {createRateLimiter} from "../middleware/rateLimit.js";

const router = express.Router();

const promoRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: "Too many attempts. Please try again later.",
});

router.post("/promo/validate", promoRateLimit, async (req, res) => {
  try {
    const {code, items} = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ok: false, message: "Promo code is required"});
    }

    const promo = await getActivePromo(code.trim().toUpperCase());

    if (!promo) {
      return res.status(400).json({ok: false, message: "Invalid or expired promo code"});
    }

    // Preview only: don't reject for unrelated sold-out items here — that's
    // enforced for real at the payment/order-submission step.
    const {verifiedItems} = await verifyOrderItems(items, {skipAvailabilityCheck: true});
    const {total, discountAmount, itemDiscounts} = applyPromoToItems(promo, verifiedItems);

    res.json({
      ok: true,
      code: promo.code,
      type: promo.type,
      discountAmount,
      total,
      itemDiscounts,
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return res.status(400).json({ok: false, message: err.message});
    }

    console.error("POST /promo/validate error:", err);
    res.status(500).json({ok: false, message: "Server error"});
  }
});

export default router;
