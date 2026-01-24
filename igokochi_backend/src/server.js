// igokochi_backend/src/server.js
const express = require("express");
require("dotenv").config();

const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

// ---- Config (hardcode for now; later move to .env) ----
const PORT = process.env.PORT || 4000;

const DB_CONFIG = {
  host: process.env.DB_HOST || "mysql", // docker service name
  user: process.env.DB_USER || "igokochi_user",
  password: process.env.DB_PASSWORD || "igokochi_pass",
  database: process.env.DB_NAME || "igokochi",
  port: Number(process.env.DB_PORT || 3306),
};

// ---- Create a pool (recommended) ----
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---- health check (optional but super useful) ----
app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ok: true, db: rows[0].ok === 1});
  } catch (err) {
    res.status(500).json({ok: false, error: err.message});
  }
});

// ---- single endpoint: create order ----
app.post("/orders", async (req, res) => {
  try {
    const payload = req.body;

    // Basic validation (minimal MVP)
    const customerName = payload?.customer?.name?.trim();
    const customerPhone = payload?.customer?.phone?.trim();
    const pickupDate = payload?.pickup?.date; // "YYYY-MM-DD"
    const pickupSlot = payload?.pickup?.slot; // "18:00-19:00"
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

    // Insert into DB (single-table MVP: items stored as JSON)
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

    const [result] = await pool.execute(sql, params);

    // respond
    res.status(201).json({
      ok: true,
      orderId: result.insertId,
    });
  } catch (err) {
    console.error("POST /orders error:", err);
    res
      .status(500)
      .json({ok: false, message: "Server error", error: err.message});
  }
});

// ---- start ----
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
