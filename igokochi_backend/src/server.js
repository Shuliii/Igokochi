import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {db} from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

/* ---------------- Health check ---------------- */
app.get("/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ok: true, db: rows[0].ok === 1});
  } catch (err) {
    res.status(500).json({ok: false, error: err.message});
  }
});

/* ---------------- GET orders ---------------- */
app.get("/orders", async (req, res) => {
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

    res.json({
      ok: true,
      orders: rows,
    });
  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch orders",
    });
  }
});

/* ---------------- POST order ---------------- */
app.post("/orders", async (req, res) => {
  try {
    const payload = req.body;

    const customerName = payload?.customer?.name?.trim();
    const customerPhone = payload?.customer?.phone?.trim();
    const pickupDate = payload?.pickup?.date;
    const pickupSlot = payload?.pickup?.slot;
    const items = payload?.items;
    const total = payload?.total;

    if (!customerName || !customerPhone) {
      return res.status(400).json({
        ok: false,
        message: "Missing customer details",
      });
    }

    if (!pickupDate || !pickupSlot) {
      return res.status(400).json({
        ok: false,
        message: "Missing pickup time",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Cart is empty",
      });
    }

    if (typeof total !== "number" || total <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid total",
      });
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

    res.status(201).json({
      ok: true,
      orderId: result.insertId,
    });
  } catch (err) {
    console.error("POST /orders error:", err);
    res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ---------------- Start server ---------------- */
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
