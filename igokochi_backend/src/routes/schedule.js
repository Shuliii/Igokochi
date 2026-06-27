import express from "express";
import {db} from "../db.js";
import {requireAuth} from "../middleware/requireAuth.js";

const router = express.Router();

/* GET /schedule - public, used by frontend to compute open days/slots */
router.get("/schedule", async (req, res) => {
  try {
    const [weekly] = await db.query(
      "SELECT day_of_week, start_hour, end_hour, enabled FROM pickup_weekly_hours ORDER BY day_of_week",
    );
    const [overrides] = await db.query(
      "SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, type, start_hour, end_hour FROM pickup_date_overrides ORDER BY date",
    );

    res.json({
      ok: true,
      weekly: weekly.map((r) => ({...r, enabled: Boolean(r.enabled)})),
      overrides,
    });
  } catch (err) {
    console.error("GET /schedule error:", err);
    res.status(500).json({ok: false, message: "Failed to fetch schedule"});
  }
});

/* POST /schedule/overrides - admin: add or update a date override */
router.post("/schedule/overrides", requireAuth, async (req, res) => {
  try {
    const {date, type, start_hour, end_hour} = req.body;

    if (!date || !type) {
      return res.status(400).json({ok: false, message: "date and type required"});
    }
    if (!["open", "closed"].includes(type)) {
      return res.status(400).json({ok: false, message: "type must be open or closed"});
    }
    if (type === "open" && (typeof start_hour !== "number" || typeof end_hour !== "number")) {
      return res.status(400).json({ok: false, message: "start_hour and end_hour required for open type"});
    }

    await db.execute(
      `INSERT INTO pickup_date_overrides (date, type, start_hour, end_hour)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE type = VALUES(type), start_hour = VALUES(start_hour), end_hour = VALUES(end_hour)`,
      [date, type, type === "open" ? start_hour : null, type === "open" ? end_hour : null],
    );

    res.json({ok: true});
  } catch (err) {
    console.error("POST /schedule/overrides error:", err);
    res.status(500).json({ok: false, message: "Failed to save override"});
  }
});

/* GET /slots/booked?date=YYYY-MM-DD - public, returns order count per slot */
router.get("/slots/booked", async (req, res) => {
  try {
    const {date} = req.query;
    if (!date) {
      return res.status(400).json({ok: false, message: "date required"});
    }

    const [rows] = await db.query(
      `SELECT pickup_slot, COUNT(DISTINCT customer_phone) AS count
       FROM orders
       WHERE pickup_date = ?
       GROUP BY pickup_slot`,
      [date],
    );

    const counts = {};
    for (const row of rows) {
      counts[row.pickup_slot] = Number(row.count);
    }

    res.json({ok: true, counts});
  } catch (err) {
    console.error("GET /slots/booked error:", err);
    res.status(500).json({ok: false, message: "Failed to fetch booked slots"});
  }
});

/* DELETE /schedule/overrides/:date - admin: remove a date override */
router.delete("/schedule/overrides/:date", requireAuth, async (req, res) => {
  try {
    const date = req.params.date;

    const [result] = await db.execute(
      "DELETE FROM pickup_date_overrides WHERE date = ?",
      [date],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ok: false, message: "Override not found"});
    }

    res.json({ok: true});
  } catch (err) {
    console.error("DELETE /schedule/overrides/:date error:", err);
    res.status(500).json({ok: false, message: "Failed to delete override"});
  }
});

export default router;
