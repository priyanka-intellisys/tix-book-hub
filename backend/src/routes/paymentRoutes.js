const express = require("express");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/authMiddleware");
const { pool, ready } = require("../config/db");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

const newId = () => `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`.slice(0, 24);
const paise = (amount) => Math.round(Number(amount || 0) * 100);

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return {
      id: `order_tixhub_${Date.now()}`,
      amount: paise(amount),
      currency,
      receipt,
      notes,
      developmentMode: true,
    };
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: paise(amount),
      currency,
      receipt,
      notes,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.description || "Unable to create Razorpay order");
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return String(orderId || "").startsWith("order_tixhub_");
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
};

router.post("/payments/create-order", requireAuth, async (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount is required" });

  const currency = req.body.currency || "INR";
  const vendorId = req.body.vendorId || req.body.vendor_id || null;
  const movieId = req.body.movieId || req.body.movie_id || null;
  const flightId = req.body.flightId || req.body.flight_id || null;
  const razorpayOrder = await createRazorpayOrder({
    amount,
    currency,
    receipt: req.body.receipt || `tixhub_${Date.now()}`,
    notes: {
      userId: req.user.id,
      vendorId,
      movieId,
      flightId,
      module: req.body.module || "",
    },
  });
  const orderId = razorpayOrder.id;

  if (await ready) {
    await pool.query(
      `INSERT INTO payments (
        id, booking_id, user_id, vendor_id, movie_id, flight_id,
        order_id, razorpay_order_id, provider, amount,
        currency, status, details, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        req.body.bookingId || req.body.booking_id || null,
        req.user.id,
        vendorId,
        movieId,
        flightId,
        orderId,
        orderId,
        "razorpay",
        amount,
        currency,
        "pending",
        JSON.stringify({ request: req.body || {}, razorpayOrder }),
        new Date(),
        new Date(),
      ]
    );
  }

  res.json({
    orderId,
    razorpayOrderId: orderId,
    amount,
    amountInPaise: razorpayOrder.amount,
    currency,
    provider: "razorpay",
    key: process.env.RAZORPAY_KEY_ID || "",
    owner: "TixHub",
    developmentMode: Boolean(razorpayOrder.developmentMode),
  });
});

router.post("/payments/verify", requireAuth, async (req, res) => {
  const paymentId = req.body.razorpay_payment_id || req.body.paymentId || req.body.payment_id || null;
  const orderId = req.body.razorpay_order_id || req.body.orderId || req.body.order_id || null;
  const signature = req.body.razorpay_signature || req.body.signature || null;
  const amount = Number(req.body.amount || 0);
  const verified = verifySignature({ orderId, paymentId, signature });

  if (!orderId || !paymentId) return res.status(400).json({ message: "Razorpay order and payment id are required" });
  if (!verified) {
    if (await ready) {
      await pool.query(
        `UPDATE payments SET status = 'failed', details = ?, updated_at = ? WHERE razorpay_order_id = ? AND user_id = ?`,
        [JSON.stringify(req.body || {}), new Date(), orderId, req.user.id]
      );
    }
    return res.status(400).json({ verified: false, message: "Payment verification failed" });
  }

  if (await ready) {
    const [result] = orderId
      ? await pool.query(
        `UPDATE payments
         SET payment_id = ?, razorpay_payment_id = ?, razorpay_signature = ?, status = 'success',
             method = ?, booking_id = COALESCE(?, booking_id), vendor_id = COALESCE(?, vendor_id),
             movie_id = COALESCE(?, movie_id), flight_id = COALESCE(?, flight_id),
             details = ?, paid_at = ?, updated_at = ?
         WHERE razorpay_order_id = ? AND user_id = ?`,
        [
          paymentId,
          paymentId,
          signature,
          req.body.method || null,
          req.body.bookingId || req.body.booking_id || null,
          req.body.vendorId || req.body.vendor_id || null,
          req.body.movieId || req.body.movie_id || null,
          req.body.flightId || req.body.flight_id || null,
          JSON.stringify(req.body || {}),
          new Date(),
          new Date(),
          orderId,
          req.user.id,
        ]
      )
      : [{ affectedRows: 0 }];

    if (!result.affectedRows) {
      await pool.query(
        `INSERT INTO payments (
          id, booking_id, user_id, vendor_id, movie_id, flight_id, order_id, payment_id,
          razorpay_order_id, razorpay_payment_id, razorpay_signature, provider,
          amount, currency, status, method, details, paid_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          req.body.bookingId || req.body.booking_id || null,
          req.user.id,
          req.body.vendorId || req.body.vendor_id || null,
          req.body.movieId || req.body.movie_id || null,
          req.body.flightId || req.body.flight_id || null,
          orderId,
          paymentId,
          orderId,
          paymentId,
          signature,
          req.body.provider || "razorpay",
          amount,
          req.body.currency || "INR",
          "success",
          req.body.method || null,
          JSON.stringify(req.body || {}),
          new Date(),
          new Date(),
          new Date(),
        ]
      );
    }

    if (req.body.vendorId || req.body.vendor_id) {
      await createNotification({
        vendorId: req.body.vendorId || req.body.vendor_id,
        userId: req.body.vendorId || req.body.vendor_id,
        type: "payment_successful",
        title: "Payment successful",
        message: `Payment of Rs ${amount || 0} received successfully.`,
        movieId: req.body.movieId || req.body.movie_id || null,
      });
    }
  }

  res.json({
    verified: true,
    paymentId,
    razorpayPaymentId: paymentId,
    orderId,
    razorpayOrderId: orderId,
  });
});

module.exports = router;
