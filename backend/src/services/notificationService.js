const crypto = require("crypto");
const { pool, ready } = require("../config/db");
const { emitVendorUpdated } = require("../socket");

const newId = () => `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);

const createNotification = async ({ vendorId, userId, title, message, type = "general", bookingId = null, movieId = null }) => {
  if (!vendorId && !userId) return null;
  if (!(await ready)) return null;

  const id = newId();
  await pool.query(
    `INSERT INTO notifications (id, vendor_id, user_id, title, message, type, is_read, booking_id, movie_id)
     VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?)`,
    [id, vendorId || null, userId || vendorId || null, title || "Notification", message || "", type, bookingId, movieId]
  );

  const notification = {
    id,
    _id: id,
    vendor_id: vendorId || null,
    vendorId: vendorId || null,
    user_id: userId || vendorId || null,
    userId: userId || vendorId || null,
    title,
    message,
    type,
    is_read: false,
    isRead: false,
    booking_id: bookingId,
    bookingId,
    movie_id: movieId,
    movieId,
    created_at: new Date(),
    createdAt: new Date(),
  };

  if (vendorId) emitVendorUpdated(vendorId, "vendorNotification", notification);
  return notification;
};

module.exports = {
  createNotification,
  newNotificationId: newId,
};
