import express from "express";
import PDFDocument from "pdfkit";
import {db} from "../db.js";
import {requireAuth} from "../middleware/requireAuth.js";

const router = express.Router();

const COLS = [
  {label: "#", key: "id", x: 40, w: 30},
  {label: "Customer", key: "customer_name", x: 70, w: 90},
  {label: "Phone", key: "customer_phone", x: 160, w: 70},
  {label: "Date", key: "pickup_date", x: 230, w: 60},
  {label: "Time", key: "pickup_slot", x: 290, w: 40},
  {label: "Items", key: "items_summary", x: 330, w: 115},
  {label: "Total", key: "total", x: 445, w: 45},
  {label: "Status", key: "status", x: 490, w: 65},
];

async function fetchOrders(from, to) {
  const [rows] = await db.query(
    `SELECT id, customer_name, customer_phone,
            DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
            pickup_slot, items, total, status
     FROM orders
     WHERE pickup_date BETWEEN ? AND ?
       AND status IN ('paid', 'done')
     ORDER BY pickup_date ASC, pickup_slot ASC`,
    [from, to],
  );
  return rows;
}

function parseItems(raw) {
  let items = raw;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) return "";
  return items.map((i) => `${i.name} ×${i.qty}`).join(", ");
}

function buildPDF(doc, orders, from, to) {
  const TABLE_W = 515;
  const MARGIN = 40;
  const ROW_H = 18;
  const HDR_H = 22;
  const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - 20;

  // ── Title ──────────────────────────────────────────────
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#2f5f3d")
    .text("Igokochi House", {align: "center"});

  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#555555")
    .text(`Order Report: ${from}  →  ${to}`, {align: "center"});

  doc
    .fontSize(9)
    .fillColor("#888888")
    .text(`Generated: ${new Date().toLocaleString()}`, {align: "center"});

  doc.moveDown(1);

  // ── Table header ───────────────────────────────────────
  let y = doc.y;

  doc.rect(MARGIN, y, TABLE_W, HDR_H).fill("#2f5f3d");
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
  COLS.forEach((col) => {
    doc.text(col.label, col.x, y + 6, {width: col.w, lineBreak: false});
  });
  y += HDR_H;

  // ── Rows ───────────────────────────────────────────────
  orders.forEach((order, idx) => {
    if (y > PAGE_BOTTOM) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    if (idx % 2 === 0) {
      doc.rect(MARGIN, y, TABLE_W, ROW_H).fill("#f4f7f2");
    }

    const cells = {
      id: String(order.id),
      customer_name: order.customer_name || "",
      customer_phone: String(order.customer_phone || ""),
      pickup_date: order.pickup_date || "",
      pickup_slot: order.pickup_slot || "",
      items_summary: parseItems(order.items),
      total: `$${Number(order.total).toFixed(2)}`,
      status: order.status || "",
    };

    doc.fontSize(8).font("Helvetica").fillColor("#333333");
    COLS.forEach((col) => {
      doc.text(cells[col.key], col.x, y + 5, {
        width: col.w,
        lineBreak: false,
        ellipsis: true,
      });
    });

    y += ROW_H;
  });

  // ── Divider ────────────────────────────────────────────
  doc.text("", MARGIN, y + 8);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + TABLE_W, doc.y)
    .stroke("#cccccc");
  doc.moveDown(0.6);

  // ── Summary ────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#333333")
    .text(`Total Orders: ${orders.length}`, MARGIN, doc.y, {continued: true})
    .text(`Total Revenue: $${totalRevenue.toFixed(2)}`, {align: "right"});
}

/* GET /reports/orders — JSON preview */
router.get("/reports/orders", requireAuth, async (req, res) => {
  const {from, to} = req.query;
  if (!from || !to) {
    return res.status(400).json({ok: false, message: "from and to required"});
  }
  try {
    const orders = await fetchOrders(from, to);
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    res.json({ok: true, orders, count: orders.length, totalRevenue});
  } catch (err) {
    console.error("GET /reports/orders error:", err);
    res.status(500).json({ok: false, message: "Failed to fetch report"});
  }
});

/* GET /reports/orders/pdf — PDF download */
router.get("/reports/orders/pdf", requireAuth, async (req, res) => {
  const {from, to} = req.query;
  if (!from || !to) {
    return res.status(400).json({ok: false, message: "from and to required"});
  }
  try {
    const orders = await fetchOrders(from, to);

    const doc = new PDFDocument({margin: 40, size: "A4"});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="igokochi-orders-${from}-to-${to}.pdf"`,
    );

    doc.pipe(res);
    buildPDF(doc, orders, from, to);
    doc.end();
  } catch (err) {
    console.error("GET /reports/orders/pdf error:", err);
    if (!res.headersSent) {
      res.status(500).json({ok: false, message: "Failed to generate PDF"});
    }
  }
});

export default router;
