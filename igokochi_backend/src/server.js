import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import {db} from "./db.js";
import {requireAuth} from "./middleware/requireAuth.js";
import {createRateLimiter} from "./middleware/rateLimit.js";
import * as auth from "./auth.js"; // ✅ add this
import paynowRoutes from "./routes/paynow.js";
import scheduleRoutes from "./routes/schedule.js";
import reportsRoutes from "./routes/reports.js";
import promoRoutes from "./routes/promo.js";
import adminChatRoutes from "./routes/adminChat.js";
import {verifyOrderItems, OrderValidationError} from "./utils/verifyOrderItems.js";
import {resolvePromo, applyPromoToItems} from "./utils/applyPromo.js";
import {attachWebSocketServer} from "./realtime/wsServer.js";
import {publishOrderEvent} from "./realtime/pubsub.js";
import {isValidDate} from "./utils/isValidDate.js";
import {isValidTime} from "./utils/isValidTime.js";

// dotenv.config();

const app = express();
app.set("trust proxy", 1); // one reverse-proxy hop (k8s ingress) in front of this app
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many login attempts. Please try again later.",
});

// Put your routes in one router so we can mount it twice
const router = express.Router();

/* ---------------- Health check ---------------- */
router.get("/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ok: true, db: rows[0].ok === 1});
  } catch (err) {
    res.status(500).json({ok: false, error: err.message});
  }
});

/* ---------------- GET menu ---------------- */
router.get("/menu", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM menu_items_table
      WHERE category <> 'bundle'
      ORDER BY sort_order ASC
    `);

    const menu = rows.map((item) => ({
      ...item,
      available: Boolean(item.available),
      modifiers:
        typeof item.modifiers === "string"
          ? JSON.parse(item.modifiers)
          : item.modifiers,
    }));

    res.json({ok: true, menu});
  } catch (err) {
    console.error("GET /menu error:", err);
    res.status(500).json({ok: false, message: "Failed to fetch menu"});
  }
});

/* ---------------- PATCH menu item (availability / category) ---------------- */
const ALLOWED_CATEGORIES = new Set(["matcha", "dessert"]);

router.patch("/menu/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const {available, category} = req.body || {};

    if (available === undefined && category === undefined) {
      return res.status(400).json({
        ok: false,
        message: "Nothing to update",
      });
    }

    if (available !== undefined && typeof available !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "Invalid availability value",
      });
    }

    if (category !== undefined && !ALLOWED_CATEGORIES.has(category)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid category value",
      });
    }

    const sets = [];
    const params = [];

    if (available !== undefined) {
      sets.push("available = ?");
      params.push(available);
    }

    if (category !== undefined) {
      sets.push("category = ?");
      params.push(category);
    }

    params.push(id);

    const [result] = await db.execute(
      `UPDATE menu_items_table SET ${sets.join(", ")} WHERE id = ?`,
      params,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Menu item not found",
      });
    }

    res.json({
      ok: true,
      updated: true,
    });
  } catch (err) {
    console.error("PATCH /menu/:id error:", err);
    res.status(500).json({
      ok: false,
      message: "Failed to update menu item",
    });
  }
});

/* ---------------- AUTH routes ---------------- */
router.post("/login", loginRateLimit, auth.login);
router.post("/changepassword", auth.changepassword);

/* ---------------- GET orders ---------------- */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        customer_name,
        customer_phone,
        pickup_date,
        pickup_slot,
        items,
        total,
        status,
        created_at
      FROM orders
      ORDER BY created_at DESC
    `);

    res.json({ok: true, orders: rows});
  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({ok: false, message: "Failed to fetch orders"});
  }
});

/* ---------------- POST order ---------------- */
router.post("/orders", async (req, res) => {
  try {
    const payload = req.body;

    const customerName = payload?.customer?.name?.trim();
    const customerPhone = payload?.customer?.phone?.trim();
    const pickupDate = payload?.pickup?.date;
    const pickupSlot = payload?.pickup?.slot;

    if (!customerName || !customerPhone) {
      return res
        .status(400)
        .json({ok: false, message: "Missing customer details"});
    }

    if (!pickupDate || !pickupSlot) {
      return res.status(400).json({ok: false, message: "Missing pickup time"});
    }

    const {verifiedItems} = await verifyOrderItems(payload?.items);
    const promo = await resolvePromo(payload?.promoCode);
    const {total: verifiedTotal} = applyPromoToItems(promo, verifiedItems);

    const sql = `
      INSERT INTO orders
        (customer_name, customer_phone, pickup_date, pickup_slot, items, total)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      customerName,
      customerPhone,
      pickupDate,
      pickupSlot,
      JSON.stringify(verifiedItems),
      verifiedTotal,
    ];

    const [result] = await db.execute(sql, params);

    await publishOrderEvent({
      type: "order:new",
      order: {
        id: result.insertId,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_date: pickupDate,
        pickup_slot: pickupSlot,
        items: verifiedItems,
        total: verifiedTotal,
        status: "new",
      },
    });

    res.status(201).json({ok: true, orderId: result.insertId, total: verifiedTotal});
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return res.status(400).json({
        ok: false,
        message: err.message,
        itemId: err.itemId,
        promoInvalid: err.promoInvalid,
      });
    }

    console.error("POST /orders error:", err);
    res
      .status(500)
      .json({ok: false, message: "Server error", error: err.message});
  }
});

/* ---------------- PATCH order status ---------------- */
router.patch("/orders/:id/status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const raw = req.body?.status;
    const status = typeof raw === "string" ? raw.trim().toLowerCase() : "";

    const allowed = new Set(["new", "paid", "ready", "done", "cancelled"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ok: false, message: "Invalid status"});
    }

    const [result] = await db.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id],
    );

    if (result.affectedRows === 1) {
      await publishOrderEvent({type: "order:status", order: {id, status}});
    }

    res.json({ok: true, updated: result.affectedRows === 1});
  } catch (err) {
    console.error("PATCH /orders/:id/status error:", err);
    res.status(500).json({ok: false, message: "Server error"});
  }
});

/* ---------------- PATCH order pickup date ---------------- */
router.patch("/orders/:id/pickup-date", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pickupDate = req.body?.pickupDate;

    if (!isValidDate(pickupDate)) {
      return res.status(400).json({ok: false, message: "Invalid date"});
    }

    const [result] = await db.execute(
      "UPDATE orders SET pickup_date = ? WHERE id = ?",
      [pickupDate, id],
    );

    if (result.affectedRows === 1) {
      await publishOrderEvent({
        type: "order:pickup_date",
        order: {id, pickup_date: pickupDate},
      });
    }

    res.json({ok: true, updated: result.affectedRows === 1});
  } catch (err) {
    console.error("PATCH /orders/:id/pickup-date error:", err);
    res.status(500).json({ok: false, message: "Server error"});
  }
});

/* ---------------- PATCH order pickup slot (time) ---------------- */
router.patch("/orders/:id/pickup-slot", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pickupSlot = req.body?.pickupSlot;

    if (!isValidTime(pickupSlot)) {
      return res.status(400).json({ok: false, message: "Invalid time"});
    }

    const [result] = await db.execute(
      "UPDATE orders SET pickup_slot = ? WHERE id = ?",
      [pickupSlot, id],
    );

    if (result.affectedRows === 1) {
      await publishOrderEvent({
        type: "order:pickup_slot",
        order: {id, pickup_slot: pickupSlot},
      });
    }

    res.json({ok: true, updated: result.affectedRows === 1});
  } catch (err) {
    console.error("PATCH /orders/:id/pickup-slot error:", err);
    res.status(500).json({ok: false, message: "Server error"});
  }
});

// Mount routes at BOTH "/" and "/api"
app.use("/api", router);
app.use("/api", paynowRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", reportsRoutes);
app.use("/api", promoRoutes);
app.use("/api", adminChatRoutes);

const httpServer = http.createServer(app);
attachWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
