const express = require("express");

const Booking = require("../models/Booking");
const WalletTransaction = require("../models/WalletTransaction");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const makeBookingCode = () => `TH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

router.use("/bookings", requireAuth);

router.get("/bookings", async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(bookings);
});

router.post("/bookings", async (req, res) => {
  const { module, title, details, seats, amount } = req.body;

  if (!module || !title || amount === undefined) {
    return res.status(400).json({ message: "Module, title, and amount are required" });
  }

  const booking = await Booking.create({
    user: req.user.id,
    module,
    title,
    details: details || {},
    seats: seats || [],
    amount,
    bookingCode: makeBookingCode(),
  });

  await WalletTransaction.create({
    user: req.user.id,
    type: "debit",
    amount,
    note: `${title} booking payment`,
  });

  res.status(201).json({ message: "Booking confirmed", booking });
});

router.patch("/bookings/:id/cancel", async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, status: { $nin: ["cancelled", "refunded"] } },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking) return res.status(404).json({ message: "Booking not found" });

  await WalletTransaction.create({
    user: req.user.id,
    type: "refund",
    amount: booking.amount,
    note: `${booking.title} cancellation refund`,
  });

  res.json({ message: "Booking cancelled", booking });
});

module.exports = router;
