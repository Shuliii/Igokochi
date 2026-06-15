import express from "express";
import PDFDocument from "pdfkit";
import {db} from "../db.js";
import {requireAuth} from "../middleware/requireAuth.js";

const router = express.Router();

const COLS = [
  {label: "#",        key: "id",            x: 40,  w: 30},
  {label: "Customer", key: "customer_name", x: 70,  w: 110},
  {label: "Date",     key: "pickup_date",   x: 180, w: 68},
  {label: "Time",     key: "pickup_slot",   x: 248, w: 42},
  {label: "Items",    key: "items_summary", x: 290, w: 190},
  {label: "Total",    key: "total",         x: 480, w: 75},
];

async function fetchOrders(from, to) {
  const [rows] = await db.query(
    `SELECT id, customer_name,
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
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) return "";
  return items.map((i) => `${i.name} ×${i.qty}`).join(", ");
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function fmtDatePDF(ymd) {
  if (!ymd) return "";
  const [, m, d] = ymd.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[m - 1]}`;
}

function fmtSlotPDF(slot) {
  if (!slot) return "";
  const [hh, mm] = slot.split(":").map(Number);
  const suffix = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return mm > 0 ? `${h12}.${String(mm).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

function fmtRangeTitle(from, to) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const fromStr = `${months[fm - 1]} ${fd}, ${fy}`;
  const toStr = `${months[tm - 1]} ${td}, ${ty}`;
  return `${fromStr}  –  ${toStr}`;
}

function buildPDF(doc, orders, from, to) {
  const TABLE_W = 515;
  const MARGIN = 40;
  const ROW_H = 22;
  const HDR_H = 24;
  const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - 20;

  // Title
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#2f5f3d")
    .text("Igokochi House", {align: "center"});

  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#555555")
    .text(`Order Report: ${fmtRangeTitle(from, to)}`, {align: "center"});

  doc
    .fontSize(9)
    .fillColor("#888888")
    .text(`Generated: ${new Date().toLocaleString()}`, {align: "center"});

  doc.moveDown(1);

  // Table header
  let y = doc.y;

  doc.rect(MARGIN, y, TABLE_W, HDR_H).fill("#3a4a35");
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
  COLS.forEach((col) => {
    doc.text(col.label, col.x, y + 8, {width: col.w, lineBreak: false});
  });
  y += HDR_H;

  // Rows
  orders.forEach((order, idx) => {
    if (y > PAGE_BOTTOM) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    if (idx % 2 === 0) {
      doc.rect(MARGIN, y, TABLE_W, ROW_H).fill("#f4f7f2");
    }

    const cells = {
      id:            String(order.id),
      customer_name: truncate(order.customer_name || "", 20),
      pickup_date:   fmtDatePDF(order.pickup_date),
      pickup_slot:   fmtSlotPDF(order.pickup_slot),
      items_summary: truncate(parseItems(order.items), 48),
      total:         `$${Number(order.total).toFixed(2)}`,
    };

    doc.fontSize(8).font("Helvetica").fillColor("#333333");
    COLS.forEach((col) => {
      doc.text(cells[col.key], col.x, y + 7, {
        width: col.w,
        lineBreak: false,
        ellipsis: true,
      });
    });

    y += ROW_H;
  });

  // Divider
  doc.text("", MARGIN, y + 8);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + TABLE_W, doc.y)
    .stroke("#cccccc");
  doc.moveDown(0.6);

  // Summary
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
