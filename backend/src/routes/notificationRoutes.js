const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { pool, ready } = require("../config/db");

const router = express.Router();

const mapNotification = (row) => ({
  id: row.id,
  _id: row.id,
  vendorId: row.vendor_id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: Boolean(row.is_read),
  read: Boolean(row.is_read),
  bookingId: row.booking_id,
  movieId: row.movie_id,
  createdAt: row.created_at,
});

router.get("/notifications/:userId", requireAuth, async (req, res) => {
  if (req.user.role !== "admin" && String(req.user.id) !== String(req.params.userId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (!(await ready)) return res.status(503).json({ message: "Database unavailable" });

  const [rows] = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = ? OR vendor_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [req.params.userId, req.params.userId]
  );
  res.json(rows.map(mapNotification));
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  if (!(await ready)) return res.status(503).json({ message: "Database unavailable" });
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = ? AND (? = 'admin' OR user_id = ? OR vendor_id = ?)`,
    [req.params.id, req.user.role, req.user.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Notification not found" });
  res.json({ message: "Notification marked as read" });
});

module.exports = router;
