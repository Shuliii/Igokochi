import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {betaTool} from "@anthropic-ai/sdk/helpers/beta/json-schema";
import {db} from "../db.js";
import {requireAuth} from "../middleware/requireAuth.js";
import {createRateLimiter} from "../middleware/rateLimit.js";
import {isValidDate} from "../utils/isValidDate.js";

const router = express.Router();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You are an assistant for Igokochi House admin staff, a small matcha/dessert shop's order system.
You have read-only access to order and sales data via the tools provided. Only answer using tool results — never
guess or fabricate numbers. If a question needs a date range and none is given, ask for one rather than assuming.
Keep answers concise and business-focused.

You can also propose changing an order's pickup date via the propose_pickup_date_change tool, when the admin gives
you an order ID and a new date. That tool only looks up the order and stages the change — it never applies it.
The admin still has to confirm the change themselves in the UI before anything is written. After calling it, just
briefly acknowledge what you're proposing; don't claim the change has already been made.`;

const chatRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many chat requests. Please try again later.",
});

const getOrderSummary = betaTool({
  name: "get_order_summary",
  description:
    "Get order counts and total revenue for a date range, broken down by status. " +
    "Use this for questions like 'how many orders this week' or 'what was revenue in October'.",
  inputSchema: {
    type: "object",
    properties: {
      from: {type: "string", description: "Start date, YYYY-MM-DD, inclusive"},
      to: {type: "string", description: "End date, YYYY-MM-DD, inclusive"},
    },
    required: ["from", "to"],
  },
  run: async ({from, to}) => {
    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return "Invalid date range. Dates must be YYYY-MM-DD and from must not be after to.";
    }

    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count, SUM(total) AS revenue
       FROM orders
       WHERE pickup_date BETWEEN ? AND ?
       GROUP BY status`,
      [from, to],
    );

    return JSON.stringify(
      rows.map((r) => ({
        status: r.status,
        count: r.count,
        revenue: Number(r.revenue || 0).toFixed(2),
      })),
    );
  },
});

const getTopSellingItems = betaTool({
  name: "get_top_selling_items",
  description:
    "Get the best-selling menu items by quantity and revenue for a date range, for completed (done) orders only.",
  inputSchema: {
    type: "object",
    properties: {
      from: {type: "string", description: "Start date, YYYY-MM-DD, inclusive"},
      to: {type: "string", description: "End date, YYYY-MM-DD, inclusive"},
      limit: {type: "integer", description: "Max items to return, default 10"},
    },
    required: ["from", "to"],
  },
  run: async ({from, to, limit}) => {
    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return "Invalid date range. Dates must be YYYY-MM-DD and from must not be after to.";
    }

    const [rows] = await db.query(
      `SELECT items FROM orders WHERE pickup_date BETWEEN ? AND ? AND status = 'done'`,
      [from, to],
    );

    const totals = new Map();
    for (const row of rows) {
      let items = row.items;
      if (typeof items === "string") {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const name = item.name || "Unknown";
        const qty = Number(item.qty) || 0;
        const revenue = (Number(item.price) || 0) * qty;
        const existing = totals.get(name);
        if (existing) {
          existing.qty += qty;
          existing.revenue += revenue;
        } else {
          totals.set(name, {name, qty, revenue});
        }
      }
    }

    const sorted = Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue);
    return JSON.stringify(sorted.slice(0, limit || 10));
  },
});

/* POST /admin/chat — admin-only chatbox for order/sales questions (read-only) */
router.post("/admin/chat", requireAuth, chatRateLimit, async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ok: false, message: "messages array is required"});
    }

    // Set by proposePickupDateChange below if Claude calls it this turn. The tool
    // only looks up the order — the actual write happens via a separate, directly
    // confirmed PATCH call, never inside this chat request.
    let pendingAction = null;

    const proposePickupDateChange = betaTool({
      name: "propose_pickup_date_change",
      description:
        "Stage a pickup date change for an order so the admin can review and confirm it. " +
        "Does NOT apply the change — only looks up the order and returns the proposed change.",
      inputSchema: {
        type: "object",
        properties: {
          orderId: {type: "integer", description: "The order's numeric ID"},
          newDate: {type: "string", description: "New pickup date, YYYY-MM-DD"},
        },
        required: ["orderId", "newDate"],
      },
      run: async ({orderId, newDate}) => {
        if (!isValidDate(newDate)) {
          return "Invalid date. Must be YYYY-MM-DD.";
        }

        const [rows] = await db.query(
          "SELECT id, customer_name, pickup_date FROM orders WHERE id = ?",
          [orderId],
        );
        if (rows.length === 0) {
          return `Order #${orderId} not found.`;
        }

        const order = rows[0];
        pendingAction = {
          type: "update_pickup_date",
          orderId: order.id,
          customerName: order.customer_name,
          oldDate: order.pickup_date,
          newDate,
        };

        return JSON.stringify({
          orderId: order.id,
          customerName: order.customer_name,
          oldDate: order.pickup_date,
          newDate,
          status: "staged — awaiting admin confirmation in the UI, not yet applied",
        });
      },
    });

    const finalMessage = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [getOrderSummary, getTopSellingItems, proposePickupDateChange],
      messages,
    });

    const reply = finalMessage.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({
      ok: true,
      reply,
      assistantMessage: {role: "assistant", content: finalMessage.content},
      pendingAction,
    });
  } catch (err) {
    console.error("POST /admin/chat error:", err);
    res.status(500).json({ok: false, message: "Chat request failed"});
  }
});

export default router;
