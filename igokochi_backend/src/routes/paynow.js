import express from "express";

const router = express.Router();

router.post("/paynow-qr", async (req, res) => {
  try {
    const {amount, editable = false} = req.body;

    if (!amount) {
      return res.status(400).json({
        error: "amount is required",
      });
    }

    // Create current Singapore time (UTC+8)
    const singaporeNow = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Singapore",
      }),
    );

    // Add 2 hours
    singaporeNow.setHours(singaporeNow.getHours() + 2);

    // Convert to ISO string
    const expiry = singaporeNow.toISOString();

    const response = await fetch("http://paynow-service:3000/api/paynow-qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        editable,

        // NEW: Send expiry to PayNow microservice
        expiry,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "failed to generate paynow qr",
    });
  }
});

export default router;
