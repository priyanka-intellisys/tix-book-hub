const express = require("express");

const {
  getShowSeats,
  setMovieSeatAvailable,
  setMovieSeatBlocked,
} = require("../services/movieSeatService");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const contextFromRequest = (req) => {
  const body = req.body || {};
  return {
    showId: req.params.showId || body.showId,
    movieId: req.query.movieId || body.movieId,
    theatreId: req.query.theatreId || body.theatreId,
    theatre: req.query.theatre || body.theatre,
    screenId: req.query.screenId || body.screenId,
    showDate: req.query.showDate || body.showDate,
    showTime: req.query.showTime || body.showTime,
    totalSeats: req.query.totalSeats || body.totalSeats,
    rows: req.query.rows || body.rows,
    seatsPerRow: req.query.seatsPerRow || body.seatsPerRow,
    price: req.query.price || body.price,
    vipSeats: req.query.vipSeats || req.query.vip_seats || body.vipSeats || body.vip_seats,
    primeSeats: req.query.primeSeats || req.query.prime_seats || body.primeSeats || body.prime_seats,
    regularSeats: req.query.regularSeats || req.query.regular_seats || body.regularSeats || body.regular_seats,
    vipPrice: req.query.vipPrice || req.query.vip_price || body.vipPrice || body.vip_price,
    primePrice: req.query.primePrice || req.query.prime_price || body.primePrice || body.prime_price,
    regularPrice: req.query.regularPrice || req.query.regular_price || body.regularPrice || body.regular_price,
    vipSeatPrice: req.query.vipSeatPrice || body.vipSeatPrice,
    premiumSeatPrice: req.query.premiumSeatPrice || body.premiumSeatPrice,
    regularSeatPrice: req.query.regularSeatPrice || body.regularSeatPrice,
    vipRowsStart: req.query.vipRowsStart || body.vipRowsStart,
    vipRowsEnd: req.query.vipRowsEnd || body.vipRowsEnd,
    vipSeatsPerRow: req.query.vipSeatsPerRow || body.vipSeatsPerRow,
    premiumRowsStart: req.query.premiumRowsStart || body.premiumRowsStart,
    premiumRowsEnd: req.query.premiumRowsEnd || body.premiumRowsEnd,
    premiumSeatsPerRow: req.query.premiumSeatsPerRow || body.premiumSeatsPerRow,
    regularRowsStart: req.query.regularRowsStart || body.regularRowsStart,
    regularRowsEnd: req.query.regularRowsEnd || body.regularRowsEnd,
    regularSeatsPerRow: req.query.regularSeatsPerRow || body.regularSeatsPerRow,
  };
};

router.get("/seats/:showId", requireAuth, asyncHandler(async (req, res) => {
  const seats = await getShowSeats(contextFromRequest(req));
  res.json({ showId: req.params.showId, seats });
}));

router.patch("/seats/block", requireAuth, requireRole("admin", "vendor"), asyncHandler(async (req, res) => {
  const seat = await setMovieSeatBlocked(contextFromRequest(req), req.body.seatNo || req.body.seatNumber, req.user, req.body.blockedReason);
  await createNotification({
    vendorId: req.user.id,
    userId: req.user.id,
    type: "seat_blocked",
    title: "Seat blocked",
    message: `${seat.seatNo || req.body.seatNo || req.body.seatNumber} blocked.`,
    movieId: seat.movieId || req.body.movieId || null,
  });
  res.json({ message: "Seat blocked", seat });
}));

router.patch("/seats/unblock", requireAuth, requireRole("admin", "vendor"), asyncHandler(async (req, res) => {
  const seat = await setMovieSeatAvailable(contextFromRequest(req), req.body.seatNo || req.body.seatNumber);
  res.json({ message: "Seat unblocked", seat });
}));

router.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ message: error.message || "Seat update failed" });
});

module.exports = router;
