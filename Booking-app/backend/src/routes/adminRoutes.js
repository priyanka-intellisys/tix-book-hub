const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Booking = require("../models/Booking");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const cleanUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

router.use(requireAuth, requireRole("admin"));

router.get("/stats", async (req, res) => {
  const [totalUsers, totalVendors, totalBookings, revenue, pendingRequests] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "vendor" }),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    User.countDocuments({ role: "vendor", status: "pending" }),
  ]);

  res.json({
    totalUsers,
    totalVendors,
    totalBookings,
    totalRevenue: revenue[0]?.total || 0,
    pendingRequests,
  });
});

router.get("/users", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(cleanUser));
});

router.patch("/users/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!["active", "blocked", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ message: "User status updated", user: cleanUser(user) });
});

router.delete("/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

router.post("/vendors", async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ message: "Name, email, mobile, and password are required" });
  }

  const exists = await User.findOne({ email: email.trim().toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const vendor = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    mobile,
    password: await bcrypt.hash(password, 12),
    role: "vendor",
    status: "active",
  });

  res.status(201).json({ message: "Vendor created", vendor: cleanUser(vendor) });
});

router.patch("/vendors/:id", async (req, res) => {
  const updates = {};
  ["name", "mobile", "status"].forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const vendor = await User.findOneAndUpdate(
    { _id: req.params.id, role: "vendor" },
    updates,
    { new: true }
  );

  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json({ message: "Vendor updated", vendor: cleanUser(vendor) });
});

router.delete("/vendors/:id", async (req, res) => {
  await User.findOneAndDelete({ _id: req.params.id, role: "vendor" });
  res.json({ message: "Vendor deleted" });
});

router.get("/bookings", async (req, res) => {
  const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(bookings);
});

router.patch("/bookings/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!["pending", "confirmed", "cancelled", "refunded"].includes(status)) {
    return res.status(400).json({ message: "Invalid booking status" });
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  res.json({ message: "Booking updated", booking });
});

module.exports = router;
