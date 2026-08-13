import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {betaTool} from "@anthropic-ai/sdk/helpers/beta/json-schema";
import {db} from "../db.js";
import {requireAuth} from "../middleware/requireAuth.js";
import {createRateLimiter} from "../middleware/rateLimit.js";
import {isValidDate} from "../utils/isValidDate.js";
import {isValidTime} from "../utils/isValidTime.js";

const router = express.Router();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const MODEL = "claude-sonnet-5";

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildSystemPrompt() {
  return `You are an assistant for Igokochi House admin staff, a small matcha/dessert shop's order system.
Today's date is ${todayYmd()} (YYYY-MM-DD). Use it to resolve relative dates ("today", "this week", "last month")
and partial dates the admin gives without a year (e.g. "15 Aug" means the closest ${todayYmd().slice(0, 4)} occurrence
unless context says otherwise) — never fall back on a guessed or remembered year.

You have read-only access to order and sales data via the tools provided. Only answer using tool results — never
guess or fabricate numbers. get_order_summary and search_orders both work with or without a date range and can be
filtered by status, and get_order_summary is for counts/revenue rollups while search_orders is for looking up
individual orders by customer name or status. Keep answers concise and business-focused.

The status values are 'new', 'paid', 'ready', 'done', 'cancelled'. Admins won't always use those exact words —
map casual language to the right status yourself: "incoming"/"pending"/"just came in" -> new, "awaiting prep"
-> paid, "ready for pickup"/"ready to collect" -> ready, "completed"/"picked up"/"finished" -> done,
"cancelled"/"voided" -> cancelled. "Open"/"outstanding"/"not done yet" covers everything except done and
cancelled — when an admin asks something like that, you may need to call the tool once per relevant status
(or just per status that applies) since each call only filters to one status at a time.

You can also propose changing an order's pickup date and/or time via the propose_pickup_change tool, when the
admin gives you an order ID and a new date, a new time, or both. That tool only looks up the order and stages
the change — it never applies it. The admin still has to confirm the change themselves in the UI before anything
is written. After calling it, just briefly acknowledge what you're proposing; don't claim the change has already
been made.`;
}

const chatRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many chat requests. Please try again later.",
});

const ORDER_STATUSES = ["new", "paid", "ready", "done", "cancelled"];

const getOrderSummary = betaTool({
  name: "get_order_summary",
  description:
    "Get order counts and total revenue, broken down by status. " +
    "Use this for questions like 'how many orders this week', 'what was revenue in October', " +
    "or 'how many cancelled orders total'. from/to are optional — omit both for an all-time summary. " +
    "Optionally filter to a single status.",
  inputSchema: {
    type: "object",
    properties: {
      from: {type: "string", description: "Start date, YYYY-MM-DD, inclusive. Omit for no lower bound."},
      to: {type: "string", description: "End date, YYYY-MM-DD, inclusive. Omit for no upper bound."},
      status: {
        type: "string",
        enum: ORDER_STATUSES,
        description: "Optional: only include orders with this status.",
      },
    },
  },
  run: async ({from, to, status}) => {
    if (from && !isValidDate(from)) return "Invalid 'from' date. Must be YYYY-MM-DD.";
    if (to && !isValidDate(to)) return "Invalid 'to' date. Must be YYYY-MM-DD.";
    if (from && to && from > to) return "'from' must not be after 'to'.";
    if (status && !ORDER_STATUSES.includes(status)) return `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}.`;

    const conditions = [];
    const params = [];
    if (from) { conditions.push("pickup_date >= ?"); params.push(from); }
    if (to) { conditions.push("pickup_date <= ?"); params.push(to); }
    if (status) { conditions.push("status = ?"); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count, SUM(total) AS revenue
       FROM orders
       ${where}
       GROUP BY status`,
      params,
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

const searchOrders = betaTool({
  name: "search_orders",
  description:
    "Look up individual orders by customer name and/or status, optionally within a date range. " +
    "Use this for questions like 'find orders for Sarah', 'what orders are still open', " +
    "or 'show pending orders this week'. All filters are optional but at least one of " +
    "customerName or status should be given to keep results useful. Returns up to 25 orders.",
  inputSchema: {
    type: "object",
    properties: {
      customerName: {type: "string", description: "Partial or full customer name to search for"},
      status: {
        type: "string",
        enum: ORDER_STATUSES,
        description: "Filter to a single status, e.g. 'new' to find orders not yet completed.",
      },
      from: {type: "string", description: "Start date, YYYY-MM-DD, inclusive"},
      to: {type: "string", description: "End date, YYYY-MM-DD, inclusive"},
    },
  },
  run: async ({customerName, status, from, to}) => {
    if (from && !isValidDate(from)) return "Invalid 'from' date. Must be YYYY-MM-DD.";
    if (to && !isValidDate(to)) return "Invalid 'to' date. Must be YYYY-MM-DD.";
    if (from && to && from > to) return "'from' must not be after 'to'.";
    if (status && !ORDER_STATUSES.includes(status)) return `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}.`;

    const conditions = [];
    const params = [];
    if (customerName) { conditions.push("customer_name LIKE ?"); params.push(`%${customerName}%`); }
    if (status) { conditions.push("status = ?"); params.push(status); }
    if (from) { conditions.push("pickup_date >= ?"); params.push(from); }
    if (to) { conditions.push("pickup_date <= ?"); params.push(to); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, customer_name,
              DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
              pickup_slot, status, total
       FROM orders
       ${where}
       ORDER BY pickup_date DESC, pickup_slot DESC
       LIMIT 25`,
      params,
    );

    return JSON.stringify(
      rows.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        pickupDate: r.pickup_date,
        pickupSlot: r.pickup_slot,
        status: r.status,
        total: Number(r.total || 0).toFixed(2),
      })),
    );
  },
});

const getItemSales = betaTool({
  name: "get_item_sales",
  description:
    "Get quantity and revenue sold for menu items — either the top sellers overall, or a specific item by name. " +
    "Use this for questions like 'what sold best this week' or 'how many strawberry matcha for Aug 15'. " +
    "from/to and status are all optional. By default it includes every order except cancelled ones (so future " +
    "orders that haven't been picked up yet are counted too) — pass status:'done' if you specifically want " +
    "completed/picked-up figures only. Pass itemName to filter to items matching that name instead of a top-N list.",
  inputSchema: {
    type: "object",
    properties: {
      from: {type: "string", description: "Start date, YYYY-MM-DD, inclusive. Omit for no lower bound."},
      to: {type: "string", description: "End date, YYYY-MM-DD, inclusive. Omit for no upper bound."},
      status: {
        type: "string",
        enum: ORDER_STATUSES,
        description: "Optional: restrict to orders with this status. Defaults to all except cancelled.",
      },
      itemName: {type: "string", description: "Optional: only include menu items whose name contains this text"},
      limit: {type: "integer", description: "Max items to return when itemName is omitted, default 10"},
    },
  },
  run: async ({from, to, status, itemName, limit}) => {
    if (from && !isValidDate(from)) return "Invalid 'from' date. Must be YYYY-MM-DD.";
    if (to && !isValidDate(to)) return "Invalid 'to' date. Must be YYYY-MM-DD.";
    if (from && to && from > to) return "'from' must not be after 'to'.";
    if (status && !ORDER_STATUSES.includes(status)) return `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}.`;

    const conditions = [];
    const params = [];
    if (from) { conditions.push("pickup_date >= ?"); params.push(from); }
    if (to) { conditions.push("pickup_date <= ?"); params.push(to); }
    conditions.push(status ? "status = ?" : "status != 'cancelled'");
    if (status) params.push(status);
    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await db.query(`SELECT items FROM orders ${where}`, params);

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

    let results = Array.from(totals.values());
    if (itemName) {
      const needle = itemName.toLowerCase();
      results = results.filter((r) => r.name.toLowerCase().includes(needle));
    }
    results.sort((a, b) => b.revenue - a.revenue);
    if (!itemName) results = results.slice(0, limit || 10);

    return JSON.stringify(
      results.map((r) => ({name: r.name, qty: r.qty, revenue: r.revenue.toFixed(2)})),
    );
  },
});

/* POST /admin/chat — admin-only chatbox for order/sales questions (read-only) */
router.post("/admin/chat", requireAuth, chatRateLimit, async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ok: false, message: "messages array is required"});
    }

    // Set by proposePickupChange below if Claude calls it this turn. The tool
    // only looks up the order — the actual write happens via separate, directly
    // confirmed PATCH calls, never inside this chat request.
    let pendingAction = null;

    const proposePickupChange = betaTool({
      name: "propose_pickup_change",
      description:
        "Stage a pickup date and/or time change for an order so the admin can review and confirm it. " +
        "Does NOT apply the change — only looks up the order and returns the proposed change. " +
        "Give newDate to change the date, newTime to change the time, or both to change either or both.",
      inputSchema: {
        type: "object",
        properties: {
          orderId: {type: "integer", description: "The order's numeric ID"},
          newDate: {type: "string", description: "New pickup date, YYYY-MM-DD. Omit to leave the date unchanged."},
          newTime: {type: "string", description: "New pickup time, 24h HH:MM. Omit to leave the time unchanged."},
        },
        required: ["orderId"],
      },
      run: async ({orderId, newDate, newTime}) => {
        if (!newDate && !newTime) {
          return "Provide at least one of newDate or newTime.";
        }
        if (newDate && !isValidDate(newDate)) {
          return "Invalid date. Must be YYYY-MM-DD.";
        }
        if (newTime && !isValidTime(newTime)) {
          return "Invalid time. Must be 24h HH:MM.";
        }

        const [rows] = await db.query(
          "SELECT id, customer_name, pickup_date, pickup_slot FROM orders WHERE id = ?",
          [orderId],
        );
        if (rows.length === 0) {
          return `Order #${orderId} not found.`;
        }

        const order = rows[0];
        pendingAction = {
          type: "update_pickup",
          orderId: order.id,
          customerName: order.customer_name,
          oldDate: order.pickup_date,
          newDate: newDate || null,
          oldTime: order.pickup_slot,
          newTime: newTime || null,
        };

        return JSON.stringify({
          orderId: order.id,
          customerName: order.customer_name,
          oldDate: order.pickup_date,
          newDate: newDate || order.pickup_date,
          oldTime: order.pickup_slot,
          newTime: newTime || order.pickup_slot,
          status: "staged — awaiting admin confirmation in the UI, not yet applied",
        });
      },
    });

    const finalMessage = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      tools: [getOrderSummary, getItemSales, searchOrders, proposePickupChange],
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
