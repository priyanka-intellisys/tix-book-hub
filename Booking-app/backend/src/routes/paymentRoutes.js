const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/payments/create-order", requireAuth, (req, res) => {
  const amount = Number(req.body.amount || 0);
  res.json({
    orderId: `order_tixhub_${Date.now()}`,
    amount,
    currency: "INR",
    provider: "razorpay",
    owner: "TixHub",
  });
});

router.post("/payments/verify", requireAuth, (req, res) => {
  res.json({
    verified: true,
    paymentId: req.body.paymentId || `pay_tixhub_${Date.now()}`,
  });
});

module.exports = router;
