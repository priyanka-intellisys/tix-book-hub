const express = require("express");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Movie = require("../models/Movie");
const SeatBlock = require("../models/SeatBlock");
const VendorListing = require("../models/VendorListing");
const WalletTransaction = require("../models/WalletTransaction");
const { requireAuth } = require("../middleware/authMiddleware");
const VendorNotification = require("../models/VendorNotification");
const { emitVendorUpdated } = require("../socket");
const { pool, ready } = require("../config/db");
const { createNotification } = require("../services/notificationService");
const {
  makeShowId,
  markMovieSeatsBooked,
  releaseMovieSeats,
  validateMovieSeatsAvailable,
} = require("../services/movieSeatService");

const router = express.Router();

const makeBookingCode = () => `TH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const makeQrToken = () => `QR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
const makeQrCodeUrl = (req, qrToken) => {
  if (!qrToken) return "";
  return `${req.protocol}://${req.get("host")}/api/vendor/qr/verify?token=${encodeURIComponent(qrToken)}`;
};

const withQrAliases = (booking) => {
  if (!booking) return booking;
  const raw = booking.toObject?.() || booking;
  return {
    ...raw,
    qrToken: booking.qrToken || booking.qr_token || "",
    qr_token: booking.qrToken || booking.qr_token || "",
    qrCodeUrl: booking.qrCodeUrl || booking.qr_code_url || "",
    qr_code_url: booking.qrCodeUrl || booking.qr_code_url || "",
    qrPayload: booking.details?.qrPayload || raw.details?.qrPayload || null,
    bookingId: booking.bookingId || booking.booking_id || booking.bookingCode || "",
    booking_id: booking.bookingId || booking.booking_id || booking.bookingCode || "",
  };
};

const buildQrPayload = (booking) => ({
  bookingId: booking.bookingId || booking.bookingCode || booking._id,
  userId: booking.user,
  movieId: booking.movieId || booking.details?.movieId || "",
  theatreId: booking.theatreId || booking.details?.theatreId || "",
  screenId: booking.screenId || booking.details?.screenId || "",
  showId: booking.showId || booking.details?.showId || "",
  selectedSeats: booking.seats || [],
  paymentStatus: booking.paymentStatus,
  bookingStatus: booking.bookingStatus || booking.status,
  qrToken: booking.qrToken,
});

const qrTokenFromRequest = (body = {}) => {
  const raw = body.qrToken || body.qr_token || body.token || body.qr || body.qrCode || "";
  if (!raw) return "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed.qrToken || parsed.qr_token || parsed.token || raw;
  } catch {
    return raw;
  }
};

const normalizePaymentStatus = (value) => {
  const status = String(value || "paid").toLowerCase();
  if (status === "paid") return "success";
  if (status === "success" || status === "pending" || status === "failed" || status === "refunded") return status;
  return "success";
};

const normalizeBookingStatus = (value) => {
  const status = String(value || "confirmed").toLowerCase();
  if (["pending", "confirmed", "completed", "cancelled", "refunded"].includes(status)) return status;
  return "confirmed";
};

const linkSuccessfulPayment = async ({ req, booking, vendorId, movieId = null, flightId = null }) => {
  const orderId = req.body.razorpay_order_id || req.body.razorpayOrderId || req.body.orderId || req.body.order_id || req.body.details?.razorpay_order_id || req.body.details?.razorpayOrderId;
  const paymentId = req.body.razorpay_payment_id || req.body.razorpayPaymentId || req.body.paymentId || req.body.payment_id || req.body.details?.razorpay_payment_id || req.body.details?.razorpayPaymentId;
  if (!(await ready) || !orderId || !paymentId) return true;

  const [payments] = await pool.query(
    `SELECT * FROM payments
     WHERE razorpay_order_id = ? AND razorpay_payment_id = ? AND user_id = ? AND status IN ('success','paid')
     LIMIT 1`,
    [orderId, paymentId, req.user.id]
  );
  if (!payments.length) return false;

  await pool.query(
    `UPDATE payments
     SET booking_id = ?, vendor_id = COALESCE(?, vendor_id), movie_id = COALESCE(?, movie_id), flight_id = COALESCE(?, flight_id), updated_at = ?
     WHERE id = ?`,
    [booking.bookingId || booking.bookingCode || booking._id, vendorId || null, movieId || null, flightId || null, new Date(), payments[0].id]
  );
  return true;
};

const resolveVendorId = async (module, body) => {
  if (body.vendorId || body.vendor) return body.vendorId || body.vendor;
  if (body.details?.vendorId || body.details?.vendor) return body.details.vendorId || body.details.vendor;

  const movieId = body.movieId || body.details?.movieId || body.details?.movie?._id || body.details?.movie?.id;
  const flightId = body.flightId || body.details?.flightId || body.details?.flight?._id || body.details?.flight?.id;

  if (module === "movie" && movieId) {
    const movie = await Movie.findById(movieId).select("vendor vendorId");
    return movie?.vendorId || movie?.vendor || null;
  }

  if (module === "flight" && flightId) {
    const flight = await Flight.findById(flightId).select("vendor vendorId") || await VendorListing.findById(flightId).select("vendor vendorId");
    return flight?.vendorId || flight?.vendor || null;
  }

  return null;
};

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

  const vendorId = await resolveVendorId(module, req.body);
  const paymentStatus = normalizePaymentStatus(req.body.paymentStatus || req.body.payment_status || details?.paymentStatus || details?.payment_status);
  const bookingStatus = normalizeBookingStatus(req.body.bookingStatus || req.body.booking_status || req.body.status);
  const qrToken = module === "movie" && paymentStatus === "success" && bookingStatus === "confirmed" ? makeQrToken() : "";
  const qrCodeUrl = makeQrCodeUrl(req, qrToken);
  const bookingCode = makeBookingCode();
  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module,
    title,
    details: details || {},
    seats: seats || [],
    amount,
    totalAmount: amount,
    status: bookingStatus,
    bookingStatus,
    paymentStatus,
    bookingCode,
    bookingId: bookingCode,
    qrToken,
    qrCodeUrl,
    checkedIn: false,
  });
  booking.details = { ...(booking.details || {}), qrToken, qr_token: qrToken, qrCodeUrl, qr_code_url: qrCodeUrl, qrPayload: buildQrPayload(booking) };
  booking.markModified?.("details");
  await booking.save();

  const linkedPayment = await linkSuccessfulPayment({ req, booking, vendorId });
  if (!linkedPayment) {
    await Booking.findByIdAndDelete(booking._id);
    return res.status(400).json({ message: "Payment must be verified before booking" });
  }

  await WalletTransaction.create({
    user: req.user.id,
    type: "debit",
    amount,
    note: `${title} booking payment`,
  });

  res.status(201).json({ message: "Booking confirmed", booking: withQrAliases(booking) });
});

router.post(["/bookings/movie", "/bookings/book-seat"], async (req, res) => {
  req.body.module = "movie";
  req.body.title = req.body.title || req.body.details?.movie?.title || "Movie booking";
  req.body.amount = req.body.amount ?? req.body.totalAmount ?? 0;
  const movieId = req.body.movieId || req.body.details?.movieId || req.body.details?.movie?._id || req.body.details?.movie?.id;
  const showId = req.body.showId || req.body.details?.showId || req.body.details?.showtime?.showId || req.body.details?.showtime?._id;
  const customerName = req.body.customerName || req.body.details?.customerName || req.body.details?.passenger?.name || req.user.name;
  const customerEmail = req.body.customerEmail || req.body.details?.customerEmail || req.body.details?.passenger?.email || req.user.email;
  const customerMobile = req.body.customerMobile || req.body.details?.customerMobile || req.body.details?.passenger?.mobile || req.user.mobile || "";
  const seats = Array.isArray(req.body.seats) ? req.body.seats : [];
  const vendorId = await resolveVendorId("movie", req.body);
  const paymentStatus = normalizePaymentStatus(req.body.paymentStatus || req.body.payment_status || req.body.details?.paymentStatus || req.body.details?.payment_status);
  const bookingStatus = normalizeBookingStatus(req.body.bookingStatus || req.body.status);
  const qrToken = paymentStatus === "success" && bookingStatus === "confirmed" ? makeQrToken() : "";
  const qrCodeUrl = makeQrCodeUrl(req, qrToken);
  const theatre = req.body.theatre || req.body.details?.theatre?.name || req.body.details?.theatre || "";
  const showDate = req.body.showDate || req.body.details?.showDate || req.body.details?.showtime?.date?.value || req.body.details?.showtime?.date?.label || "";
  const showTime = req.body.showTime || req.body.details?.showTime || req.body.details?.showtime?.time || "";

  if (!movieId) return res.status(400).json({ message: "movieId is required" });
  if (!seats.length) return res.status(400).json({ message: "At least one seat is required" });

  const movie = await Movie.findById(movieId).select("title vendor vendorId bookedSeats");
  if (!movie) return res.status(404).json({ message: "Movie not found" });

  const blockedSeats = await SeatBlock.find({
    vendorId: vendorId || movie.vendorId || movie.vendor,
    targetType: { $in: ["movie", "show"] },
    targetId: { $in: [movieId, showId].filter(Boolean) },
    seatNumber: { $in: seats },
    status: "blocked",
  });

  if (blockedSeats.length) {
    return res.status(409).json({ message: `Seats blocked by vendor: ${blockedSeats.map((seat) => seat.seatNumber).join(", ")}` });
  }

  const seatContext = {
    showId: makeShowId({ showId: showId || movieId, movieId }),
    movieId,
    theatre,
    screenId: req.body.screenId || req.body.details?.screenId || req.body.details?.showtime?.screenId || req.body.details?.showtime?.screen?._id || "Screen 1",
    showDate,
    showTime,
    totalSeats: req.body.totalSeats || req.body.details?.totalSeats || req.body.details?.showtime?.totalSeats || req.body.details?.showtime?.screen?.totalSeats || movie.totalSeats,
    rows: req.body.rows || req.body.details?.rows || req.body.details?.showtime?.screen?.rows,
    seatsPerRow: req.body.seatsPerRow || req.body.details?.seatsPerRow || req.body.details?.showtime?.screen?.seatsPerRow,
    price: req.body.price || req.body.details?.showtime?.price || movie.ticketPrice,
    vipSeats: req.body.vipSeats || req.body.details?.vipSeats || req.body.details?.showtime?.vipSeats || req.body.details?.showtime?.screen?.vipSeats,
    primeSeats: req.body.primeSeats || req.body.details?.primeSeats || req.body.details?.showtime?.primeSeats || req.body.details?.showtime?.screen?.primeSeats,
    regularSeats: req.body.regularSeats || req.body.details?.regularSeats || req.body.details?.showtime?.regularSeats || req.body.details?.showtime?.screen?.regularSeats,
    vipPrice: req.body.vipPrice || req.body.details?.vipPrice || req.body.details?.showtime?.vipPrice || req.body.details?.showtime?.screen?.vipPrice,
    primePrice: req.body.primePrice || req.body.details?.primePrice || req.body.details?.showtime?.primePrice || req.body.details?.showtime?.screen?.primePrice,
    regularPrice: req.body.regularPrice || req.body.details?.regularPrice || req.body.details?.showtime?.regularPrice || req.body.details?.showtime?.screen?.regularPrice,
    vipSeatPrice: req.body.vipSeatPrice || req.body.details?.vipSeatPrice || movie.vipSeatPrice,
    premiumSeatPrice: req.body.premiumSeatPrice || req.body.details?.premiumSeatPrice || movie.premiumSeatPrice,
    regularSeatPrice: req.body.regularSeatPrice || req.body.details?.regularSeatPrice || movie.regularSeatPrice,
    vipRowsStart: req.body.vipRowsStart || req.body.details?.vipRowsStart,
    vipRowsEnd: req.body.vipRowsEnd || req.body.details?.vipRowsEnd,
    vipSeatsPerRow: req.body.vipSeatsPerRow || req.body.details?.vipSeatsPerRow,
    premiumRowsStart: req.body.premiumRowsStart || req.body.details?.premiumRowsStart,
    premiumRowsEnd: req.body.premiumRowsEnd || req.body.details?.premiumRowsEnd,
    premiumSeatsPerRow: req.body.premiumSeatsPerRow || req.body.details?.premiumSeatsPerRow,
    regularRowsStart: req.body.regularRowsStart || req.body.details?.regularRowsStart,
    regularRowsEnd: req.body.regularRowsEnd || req.body.details?.regularRowsEnd,
    regularSeatsPerRow: req.body.regularSeatsPerRow || req.body.details?.regularSeatsPerRow,
    todayVisibleRowStart: req.body.todayVisibleRowStart || req.body.details?.todayVisibleRowStart,
    todayVisibleRowEnd: req.body.todayVisibleRowEnd || req.body.details?.todayVisibleRowEnd,
  };
  await validateMovieSeatsAvailable(seatContext, seats);

  const seatDetails = seats.map((seatNumber) => ({
    seatNumber,
    status: "booked",
    customerName,
    customerEmail,
    customerMobile,
    amount: req.body.amount,
    paymentStatus: req.body.paymentStatus || "Paid",
  }));

  const bookingCode = makeBookingCode();
  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module: "movie",
    movieId,
    showId: showId || undefined,
    customerName,
    customerEmail,
    customerMobile,
    title: req.body.title || movie.title,
    details: {
      ...(req.body.details || {}),
      movieId,
      showId,
      screenId: seatContext.screenId,
      vendorId,
      customerName,
      customerEmail,
      customerMobile,
      theatre,
      showDate,
      showTime,
      totalSeats: seatContext.totalSeats,
      seatDetails,
      qrToken,
      qr_token: qrToken,
      qrCodeUrl,
      qr_code_url: qrCodeUrl,
    },
    seats,
    amount: req.body.amount,
    totalAmount: req.body.amount,
    status: bookingStatus,
    bookingStatus,
    paymentStatus,
    bookingCode,
    bookingId: bookingCode,
    qrToken,
    qrCodeUrl,
    checkedIn: false,
  });

  await Movie.findByIdAndUpdate(movieId, {
    $addToSet: { bookedSeats: { $each: seats } },
  });

  booking.details.seatDetails = seatDetails.map((seat) => ({
    ...seat,
    bookingId: booking._id,
  }));
  booking.details.qrToken = qrToken;
  booking.details.qr_token = qrToken;
  booking.details.qrCodeUrl = qrCodeUrl;
  booking.details.qr_code_url = qrCodeUrl;
  booking.details.qrPayload = buildQrPayload(booking);
  booking.markModified("details");
  await booking.save();
  await markMovieSeatsBooked(seatContext, seats, booking, { customerName, customerEmail, customerMobile });
  const linkedPayment = await linkSuccessfulPayment({ req, booking, vendorId, movieId });
  if (!linkedPayment) {
    await releaseMovieSeats(seatContext, seats);
    await Booking.findByIdAndDelete(booking._id);
    return res.status(400).json({ message: "Payment must be verified before booking" });
  }
  if (vendorId) {
    const notification = await VendorNotification.create({
      vendor: vendorId,
      vendorId,
      type: "new_booking",
      title: "New booking alert",
      message: `${customerName} booked ${seats.join(", ")} for ${booking.title}`,
      bookingId: booking._id,
      read: false,
    });
    await createNotification({
      vendorId,
      userId: vendorId,
      type: "new_booking",
      title: "New booking received",
      message: `${customerName} booked ${seats.join(", ")} for ${booking.title}`,
      bookingId: booking.bookingId || booking.bookingCode || booking._id,
      movieId,
    });
    emitVendorUpdated(vendorId, "newBooking", { booking, notification });
  }

  res.status(201).json({ message: "Movie booking confirmed", booking: withQrAliases(booking) });
});

router.put("/bookings/:bookingId/edit", async (req, res) => {
  const booking = await Booking.findOne({
    $or: [{ _id: req.params.bookingId }, { bookingId: req.params.bookingId }, { bookingCode: req.params.bookingId }],
    user: req.user.id,
    module: "movie",
  });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const paymentStatus = String(booking.paymentStatus || booking.payment_status || "").toLowerCase();
  const bookingStatus = String(booking.bookingStatus || booking.status || "").toLowerCase();
  if (booking.checkedIn || ["completed", "cancelled", "refunded"].includes(bookingStatus)) {
    return res.status(409).json({ message: "Booking cannot be edited" });
  }
  if (["paid", "success"].includes(paymentStatus) && bookingStatus === "confirmed" && !req.body.allowConfirmedEdit) {
    return res.status(409).json({ message: "Paid confirmed booking cannot be edited" });
  }

  const newSeats = Array.isArray(req.body.seats) ? req.body.seats : [];
  if (!newSeats.length) return res.status(400).json({ message: "At least one seat is required" });

  const details = booking.details || {};
  const seatContext = {
    showId: booking.showId || details.showId,
    movieId: booking.movieId || details.movieId,
    theatreId: booking.theatreId || details.theatreId,
    theatre: details.theatre?.name || details.theatre || booking.theatre,
    screenId: booking.screenId || details.screenId,
    showDate: booking.showDate || details.showDate,
    showTime: booking.showTime || details.showTime,
    totalSeats: details.totalSeats,
    vipRowsStart: details.vipRowsStart,
    vipRowsEnd: details.vipRowsEnd,
    vipSeatsPerRow: details.vipSeatsPerRow,
    premiumRowsStart: details.premiumRowsStart,
    premiumRowsEnd: details.premiumRowsEnd,
    premiumSeatsPerRow: details.premiumSeatsPerRow,
    regularRowsStart: details.regularRowsStart,
    regularRowsEnd: details.regularRowsEnd,
    regularSeatsPerRow: details.regularSeatsPerRow,
  };

  const oldSeats = booking.seats || [];
  await releaseMovieSeats(seatContext, oldSeats);
  try {
    await validateMovieSeatsAvailable(seatContext, newSeats);
    booking.seats = newSeats;
    booking.seatNumbers = newSeats;
    booking.details = {
      ...details,
      seats: newSeats,
      seatDetails: newSeats.map((seatNumber) => ({ seatNumber, status: "booked", bookingId: booking._id })),
    };
    booking.qrToken = makeQrToken();
    booking.qrCodeUrl = makeQrCodeUrl(req, booking.qrToken);
    booking.details.qrToken = booking.qrToken;
    booking.details.qr_token = booking.qrToken;
    booking.details.qrCodeUrl = booking.qrCodeUrl;
    booking.details.qr_code_url = booking.qrCodeUrl;
    booking.details.qrPayload = buildQrPayload(booking);
    booking.editCount = Number(booking.editCount || 0) + 1;
    booking.markModified?.("details");
    await booking.save();
    await markMovieSeatsBooked(seatContext, newSeats, booking, {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerMobile: booking.customerMobile,
    });
    res.json({ message: "Booking updated", booking: withQrAliases(booking) });
  } catch (error) {
    await markMovieSeatsBooked(seatContext, oldSeats, booking, {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerMobile: booking.customerMobile,
    });
    throw error;
  }
});

router.post("/bookings/verify-qr", async (req, res) => {
  const qrToken = qrTokenFromRequest(req.body);
  if (!qrToken) return res.status(400).json({ status: "invalid", message: "Invalid QR" });

  const booking = await Booking.findOne({ qrToken });
  const logCheckin = async (status, message, code = 200) => {
    if (booking) {
      const checkinId = `${Date.now().toString(16)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 24);
      try {
        const { pool } = require("../config/db");
        await pool.query(
          `INSERT INTO qr_checkins (id, booking_id, qr_token, vendor_id, checked_by, status, message)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [checkinId, booking.bookingId || booking.bookingCode || booking._id, qrToken, booking.vendorId || booking.vendor || null, req.user.id, status, message]
        );
      } catch {
        // QR verification should still return the validation result if audit logging fails.
      }
    }
    return res.status(code).json({ status, message, booking: booking ? withQrAliases(booking) : null });
  };

  if (!booking) return logCheckin("invalid", "Invalid QR", 404);
  const paymentStatus = String(booking.paymentStatus || "").toLowerCase();
  const bookingStatus = String(booking.bookingStatus || booking.status || "").toLowerCase();
  if (!["paid", "success"].includes(paymentStatus)) return logCheckin("invalid", "Payment not completed", 400);
  if (bookingStatus === "cancelled") return logCheckin("invalid", "Booking cancelled", 400);
  if (bookingStatus !== "confirmed") return logCheckin("invalid", "Booking not confirmed", 400);
  if (booking.checkedIn) return logCheckin("already_checked_in", "Already checked in", 409);

  const showDate = booking.showDate || booking.details?.showDate;
  if (showDate) {
    const today = new Date().toISOString().slice(0, 10);
    const bookingDate = String(showDate).slice(0, 10);
    if (bookingDate && bookingDate !== today) return logCheckin("invalid", "Wrong show time", 400);
  }

  booking.checkedIn = true;
  booking.checkedInAt = new Date();
  booking.scannedBy = req.user.id;
  booking.markModified?.("details");
  await booking.save();
  return logCheckin("valid", "Valid Ticket");
});

router.post("/bookings/flight", async (req, res) => {
  req.body.module = "flight";
  req.body.title = req.body.title || `${req.body.details?.flight?.airline || "Flight"} ${req.body.details?.flight?.flightNumber || ""}`;
  req.body.amount = req.body.amount ?? req.body.totalAmount ?? 0;
  const flightId = req.body.flightId || req.body.details?.flightId || req.body.details?.flight?._id || req.body.details?.flight?.id;
  const seats = Array.isArray(req.body.seats) ? req.body.seats : [];
  const vendorId = await resolveVendorId("flight", req.body);
  const pnr = `PNR${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const passenger = req.body.details?.passenger || {};

  if (flightId) {
    const flight = await Flight.findById(flightId);
    if (flight) {
      const seatMap = new Map((flight.seats || []).map((seat) => [seat.seatNumber, seat]));
      const alreadyUnavailable = seats.filter((seatNumber) => {
        const seat = seatMap.get(seatNumber);
        return seat && seat.status !== "available";
      });
      if (alreadyUnavailable.length) {
        return res.status(409).json({ message: `Seats unavailable: ${alreadyUnavailable.join(", ")}` });
      }
      seats.forEach((seatNumber) => {
        const seat = seatMap.get(seatNumber);
        if (!seat) return;
        seat.status = "booked";
        seat.passengerName = passenger.name || req.user.name || "Passenger";
        seat.pnr = pnr;
        seat.mobile = passenger.mobile || req.user.mobile || "";
        seat.email = passenger.email || req.user.email || "";
        seat.amount = req.body.amount;
        seat.paymentStatus = "paid";
        seat.bookingStatus = "confirmed";
        seat.bookingDate = new Date();
      });
      flight.bookedSeats = flight.seats.filter((seat) => seat.status === "booked").length;
      flight.blockedSeats = flight.seats.filter((seat) => seat.status === "blocked").length;
      flight.availableSeats = Math.max(Number(flight.totalSeats || flight.seats.length) - flight.bookedSeats - flight.blockedSeats, 0);
      await flight.save();
    }
  }

  const booking = await Booking.create({
    user: req.user.id,
    vendor: vendorId,
    vendorId,
    module: "flight",
    title: req.body.title,
    details: { ...(req.body.details || req.body), pnr, flightId },
    seats,
    amount: req.body.amount,
    bookingCode: makeBookingCode(),
  });
  res.status(201).json({ message: "Flight booking confirmed", booking, pnr });
});

router.get("/my-bookings", requireAuth, async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(bookings);
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
