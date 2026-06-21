const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { pool, ready } = require("../config/db");

const router = express.Router();

const money = (value) => Number(Number(value || 0).toFixed(2));
const canAccessVendor = (req, vendorId) => req.user.role === "admin" || String(req.user.id) === String(vendorId);

const daysBack = (days = 7) => Array.from({ length: days }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - index - 1));
  return date.toISOString().slice(0, 10);
});

const vendorGuard = async (req, res, next) => {
  if (!canAccessVendor(req, req.params.vendorId)) return res.status(403).json({ message: "Forbidden" });
  if (!(await ready)) return res.status(503).json({ message: "Database unavailable" });
  next();
};

router.use("/dashboard/vendor/:vendorId", requireAuth, vendorGuard);

router.get("/dashboard/vendor/:vendorId/stats", async (req, res) => {
  const { vendorId } = req.params;

  const [[bookingStats], [paymentStats], [movieSeatStats], [flightSeatStats], [todayPaymentStats], [recentBookings]] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS totalBookings,
         SUM(DATE(created_at) = CURDATE()) AS todayBookings
       FROM bookings
       WHERE vendor_id = ? AND booking_status IN ('confirmed','completed')`,
      [vendorId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS totalRevenue
       FROM payments
       WHERE vendor_id = ? AND status IN ('success','paid')`,
      [vendorId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT
         SUM(se.status = 'available') AS availableSeats,
         SUM(se.status = 'booked') AS bookedSeats,
         SUM(se.status = 'blocked') AS blockedSeats
       FROM seats se
       LEFT JOIN movie_shows sh ON sh.id = se.show_id
       LEFT JOIN movies m ON m.id = se.movie_id
       WHERE COALESCE(sh.vendor_id, m.vendor_id) = ?`,
      [vendorId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT
         COALESCE(SUM(available_seats), 0) AS availableSeats,
         COALESCE(SUM(booked_seats), 0) AS bookedSeats,
         COALESCE(SUM(blocked_seats), 0) AS blockedSeats
       FROM flights
       WHERE vendor_id = ?`,
      [vendorId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS todayRevenue
       FROM payments
       WHERE vendor_id = ? AND status IN ('success','paid') AND DATE(created_at) = CURDATE()`,
      [vendorId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT id AS _id, booking_code AS bookingCode, module, title, customer_name AS customerName,
              amount, payment_status AS paymentStatus, booking_status AS bookingStatus, created_at AS createdAt
       FROM bookings
       WHERE vendor_id = ?
       ORDER BY created_at DESC
       LIMIT 8`,
      [vendorId]
    ).then(([rows]) => rows),
  ]);

  res.json({
    totalRevenue: money(paymentStats.totalRevenue),
    revenue: money(paymentStats.totalRevenue),
    totalBookings: Number(bookingStats.totalBookings || 0),
    todayBookings: Number(bookingStats.todayBookings || 0),
    todayRevenue: money(todayPaymentStats.todayRevenue),
    availableSeats: Number(movieSeatStats.availableSeats || 0) + Number(flightSeatStats.availableSeats || 0),
    bookedSeats: Number(movieSeatStats.bookedSeats || 0) + Number(flightSeatStats.bookedSeats || 0),
    blockedSeats: Number(movieSeatStats.blockedSeats || 0) + Number(flightSeatStats.blockedSeats || 0),
    recentBookings,
  });
});

router.get("/dashboard/vendor/:vendorId/booking-trend", async (req, res) => {
  const labels = daysBack(7);
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS value
     FROM bookings
     WHERE vendor_id = ? AND booking_status IN ('confirmed','completed')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day`,
    [req.params.vendorId]
  );
  const byDay = new Map(rows.map((row) => [new Date(row.day).toISOString().slice(0, 10), Number(row.value || 0)]));
  res.json(labels.map((day) => ({ label: day.slice(5), date: day, value: byDay.get(day) || 0 })));
});

router.get("/dashboard/vendor/:vendorId/revenue-trend", async (req, res) => {
  const labels = daysBack(7);
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS day, COALESCE(SUM(amount), 0) AS value
     FROM payments
     WHERE vendor_id = ? AND status IN ('success','paid')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day`,
    [req.params.vendorId]
  );
  const byDay = new Map(rows.map((row) => [new Date(row.day).toISOString().slice(0, 10), money(row.value)]));
  res.json(labels.map((day) => ({ label: day.slice(5), date: day, value: byDay.get(day) || 0 })));
});

module.exports = router;
