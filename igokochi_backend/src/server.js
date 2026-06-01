import "dotenv/config";
import express from "express";
import cors from "cors";
import {db} from "./db.js";
import {requireAuth} from "./middleware/requireAuth.js";
import * as auth from "./auth.js"; // ✅ add this
import paynowRoutes from "./routes/paynow.js";
import scheduleRoutes from "./routes/schedule.js";

// dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

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
      FROM menu_items
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

/* ---------------- PATCH menu item availability ---------------- */
router.patch("/menu/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const available = req.body?.available;

    if (typeof available !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "Invalid availability value",
      });
    }

    const [result] = await db.execute(
      "UPDATE menu_items SET available = ? WHERE id = ?",
      [available, id],
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
router.post("/register", auth.register);
router.post("/login", auth.login);
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
    const items = payload?.items;
    const total = payload?.total;

    if (!customerName || !customerPhone) {
      return res
        .status(400)
        .json({ok: false, message: "Missing customer details"});
    }

    if (!pickupDate || !pickupSlot) {
      return res.status(400).json({ok: false, message: "Missing pickup time"});
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ok: false, message: "Cart is empty"});
    }

    if (typeof total !== "number" || total <= 0) {
      return res.status(400).json({ok: false, message: "Invalid total"});
    }

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
      JSON.stringify(items),
      total,
    ];

    const [result] = await db.execute(sql, params);

    res.status(201).json({ok: true, orderId: result.insertId});
  } catch (err) {
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

    const allowed = new Set(["new", "paid", "ready", "done"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ok: false, message: "Invalid status"});
    }

    const [result] = await db.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id],
    );

    res.json({ok: true, updated: result.affectedRows === 1});
  } catch (err) {
    console.error("PATCH /orders/:id/status error:", err);
    res.status(500).json({ok: false, message: "Server error"});
  }
});

// Mount routes at BOTH "/" and "/api"
app.use("/api", router);
app.use("/api", paynowRoutes);
app.use("/api", scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
