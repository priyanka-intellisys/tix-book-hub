const express = require("express");

const router = express.Router();

const Movie =
require("../models/Movie");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { emitVendorUpdated } = require("../socket");
const { pool } = require("../config/db");
const Screen = require("../models/Screen");
const Show = require("../models/Show");
const { ensureShowSeats, getShowSeats } = require("../services/movieSeatService");

const validateMoviePayload = (body) => {
  const requiredFields = [
    ["title", "Movie title"],
    ["language", "Language"],
    ["duration", "Duration"],
    ["image", "Poster URL"],
    ["theatre", "Theatre"],
    ["genre", "Genre"],
    ["releaseDate", "Release date"],
  ];

  for (const [field, label] of requiredFields) {
    if (!String(body[field] || "").trim()) return `${label} is required`;
  }

  if (Number(body.ticketPrice) <= 0) return "Ticket price must be greater than 0";
  if (Number(body.totalSeats) <= 0) return "Total seats must be greater than 0";

  return "";
};

/* GET MOVIES */

router.get(
  "/movies",

  async (req, res) => {

    try {

      const movies =
      await Movie.find({
        status: { $nin: ["ended", "cancelled", "hidden"] },
      });

      res.json(movies);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* GET MOVIE BY ID */

router.get(
  "/movies/:id",

  async (req, res) => {

    try {

      const movie =
      await Movie.findById(req.params.id);

      if (!movie) {
        return res.status(404).json({
          message:"Movie not found",
        });
      }

      res.json(movie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

const normalizeShowTimes = (movie) => {
  if (Array.isArray(movie.showTimes) && movie.showTimes.length) return movie.showTimes;
  return String(movie.showTime || movie.showtime || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const dateOnly = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const rowNameForIndex = (index) => {
  let value = Number(index);
  let label = "";
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
};

const defaultLayoutForMovie = (movie) => {
  const total = Math.max(Number(movie.totalSeats || 120), 1);
  const hasVip = Number(movie.vipSeatPrice || 0) > 0;
  const hasPremium = Number(movie.premiumSeatPrice || 0) > 0;
  const vipSeats = hasVip && total >= 60 ? 20 : 0;
  const premiumSeats = hasPremium && total >= 80 ? 40 : 0;
  const regularSeats = Math.max(total - vipSeats - premiumSeats, 0);
  const layout = [];
  let rowIndex = 0;
  const pushSection = (category, count, seatsPerRow, price) => {
    if (!count) return;
    const rows = Math.ceil(count / seatsPerRow);
    layout.push({
      category,
      rowStart: rowNameForIndex(rowIndex),
      rowEnd: rowNameForIndex(rowIndex + rows - 1),
      seatsPerRow,
      price,
      generatedSeats: rows * seatsPerRow,
    });
    rowIndex += rows;
  };
  pushSection("VIP", vipSeats, 10, movie.vipSeatPrice || movie.ticketPrice || 0);
  pushSection("PREMIUM", premiumSeats, 10, movie.premiumSeatPrice || movie.ticketPrice || 0);
  pushSection("REGULAR", regularSeats, regularSeats % 20 === 0 ? 20 : Math.max(regularSeats, 1), movie.regularSeatPrice || movie.ticketPrice || 0);
  return layout;
};

const saveDefaultScreenLayout = async (screen, movie) => {
  const layout = defaultLayoutForMovie(movie);
  await pool.query("DELETE FROM screen_seat_layouts WHERE screen_id = ?", [screen._id]);
  await pool.query(
    `INSERT INTO screen_seat_layouts (
      screen_id, movie_id, theatre_id, category, row_start, row_end, seats_per_row, price, generated_seats
    ) VALUES ?`,
    [layout.map((item) => [screen._id, movie._id, screen.theatreId || null, item.category, item.rowStart, item.rowEnd, item.seatsPerRow, item.price, item.generatedSeats])]
  );
  return layout;
};

const deriveScreenShape = (totalSeats) => {
  const total = Math.max(Number(totalSeats || 120), 1);
  const seatsPerRow = Math.min(20, Math.max(10, Math.ceil(Math.sqrt(total))));
  return {
    rows: Math.ceil(total / seatsPerRow),
    seatsPerRow,
    totalSeats: total,
  };
};

const ensureMovieShows = async (movie) => {
  let shows = await Show.find({ movieId: movie._id });
  if (shows.length) return shows;

  const shape = deriveScreenShape(movie.totalSeats);
  const defaultLayout = defaultLayoutForMovie(movie);
  const vipLayout = defaultLayout.find((item) => item.category === "VIP") || {};
  const premiumLayout = defaultLayout.find((item) => item.category === "PREMIUM") || {};
  const regularLayout = defaultLayout.find((item) => item.category === "REGULAR") || {};
  const screen = await Screen.create({
    vendor: movie.vendor || movie.vendorId,
    vendorId: movie.vendorId || movie.vendor,
    movieId: movie._id,
    theatreId: null,
    name: movie.screenName || movie.screenNumber || "Screen 1",
    rows: shape.rows,
    seatsPerRow: shape.seatsPerRow,
    totalSeats: shape.totalSeats,
    vipSeats: vipLayout.generatedSeats || 0,
    primeSeats: premiumLayout.generatedSeats || 0,
    regularSeats: regularLayout.generatedSeats || shape.totalSeats,
    vipPrice: movie.vipSeatPrice || 0,
    primePrice: movie.premiumSeatPrice || 0,
    regularPrice: movie.regularSeatPrice || movie.ticketPrice || 240,
    screenType: movie.format || "2D",
    status: "active",
  });
  await saveDefaultScreenLayout(screen, movie);

  const showTimes = normalizeShowTimes(movie);
  const times = showTimes.length ? showTimes : [movie.showTime || "10:00 AM"];
  const showDate = dateOnly(movie.showDate || movie.releaseDate);
  shows = [];

  for (const showTime of times) {
    const existing = await Show.findOne({
      movieId: movie._id,
      screenId: screen._id,
      showDate,
      showTime,
    });
    const show = existing || await Show.create({
      vendor: movie.vendor || movie.vendorId,
      vendorId: movie.vendorId || movie.vendor,
      movieId: movie._id,
      theatreId: null,
      screenId: screen._id,
      showDate,
      showTime,
      price: movie.ticketPrice || movie.regularSeatPrice || 240,
      status: "active",
    });

    await ensureShowSeats({
      showId: show._id,
      movieId: movie._id,
      screenId: screen._id,
      showDate,
      showTime,
      rows: shape.rows,
      seatsPerRow: shape.seatsPerRow,
      totalSeats: shape.totalSeats,
      price: show.price || movie.ticketPrice,
      regularSeatPrice: movie.regularSeatPrice,
      premiumSeatPrice: movie.premiumSeatPrice,
      vipSeatPrice: movie.vipSeatPrice,
    });
    shows.push(show);
  }

  return shows;
};

router.get("/movies/:movieId/screens", async (req, res) => {
  try {
    const [screens] = await pool.query(
      `SELECT ms.*, ms.id AS _id, ms.name AS screen_name, t.theatre_name, t.city, t.location
       FROM movie_screens ms
       LEFT JOIN theatres t ON t.id = ms.theatre_id
       WHERE ms.movie_id = ? OR ms.movie_id IS NULL
       ORDER BY ms.created_at DESC`,
      [req.params.movieId]
    );
    if (!screens.length) {
      const movie = await Movie.findById(req.params.movieId);
      if (movie) await ensureMovieShows(movie);
      const [createdScreens] = await pool.query(
        `SELECT ms.*, ms.id AS _id, ms.name AS screen_name, t.theatre_name, t.city, t.location
         FROM movie_screens ms
         LEFT JOIN theatres t ON t.id = ms.theatre_id
         WHERE ms.movie_id = ?
         ORDER BY ms.created_at DESC`,
        [req.params.movieId]
      );
      return res.json({ screens: createdScreens });
    }
    res.json({ screens });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/movies/:movieId/screens/:screenId/shows", async (req, res) => {
  try {
    const [shows] = await pool.query(
      `SELECT s.*, s.id AS _id, ms.name AS screen_name, ms.total_seats, ms.vip_seats, ms.prime_seats,
              ms.regular_seats, ms.vip_price, ms.prime_price, ms.regular_price
       FROM movie_shows s
       JOIN movie_screens ms ON ms.id = s.screen_id
       WHERE s.movie_id = ? AND s.screen_id = ?
       ORDER BY s.show_date, s.show_time`,
      [req.params.movieId, req.params.screenId]
    );
    res.json({ shows });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/movies/:movieId/shows/:showId/seats", async (req, res) => {
  try {
    const [shows] = await pool.query("SELECT * FROM movie_shows WHERE id = ? AND movie_id = ? LIMIT 1", [req.params.showId, req.params.movieId]);
    const show = shows[0];
    if (!show) return res.status(404).json({ message: "Show not found" });
    const seats = await getShowSeats({
      showId: show.id,
      movieId: show.movie_id,
      theatreId: show.theatre_id,
      screenId: show.screen_id,
      showDate: show.show_date,
      showTime: show.show_time,
    });
    res.json({ show, seats });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/movies/:id/shows", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const [shows, screens] = await Promise.all([
      ensureMovieShows(movie),
      Screen.find({ movieId: movie._id }),
    ]);
    const screenMap = new Map(screens.map((screen) => [String(screen._id), screen]));
    const screenIds = screens.map((screen) => String(screen._id));
    const [layoutRows] = screenIds.length
      ? await pool.query("SELECT * FROM screen_seat_layouts WHERE screen_id IN (?)", [screenIds])
      : [[]];
    const layoutMap = layoutRows.reduce((acc, row) => {
      if (!acc[row.screen_id]) acc[row.screen_id] = [];
      acc[row.screen_id].push(row);
      return acc;
    }, {});

    res.json({
      movie,
      shows: shows.map((show) => {
        const screen = screenMap.get(String(show.screenId));
        const screenObject = screen ? { ...(screen.toObject?.() || screen), layout: layoutMap[String(screen._id)] || [] } : screen;
        return {
          ...show.toObject?.() || show,
          screen: screenObject,
          screenName: screenObject?.name || movie.screenNumber || "Screen 1",
          theatre: {
            name: movie.theatreName || movie.theatre || "Theatre details unavailable",
            location: movie.theatreAddress || movie.theatreCity || movie.city || "Configured by vendor",
          },
          totalSeats: screenObject?.totalSeats || movie.totalSeats || 120,
          availableSeats: screenObject?.totalSeats || movie.totalSeats || 120,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/movies/:id/reviews", requireAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = {
      id: `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`.slice(0, 24),
      bookingId: req.body.bookingId || "",
      userId: req.user.id,
      movieId: movie._id,
      vendorId: movie.vendorId || movie.vendor,
      rating,
      review: req.body.review || req.body.comment || "",
    };
    await pool.query(
      `INSERT INTO movie_reviews (id, booking_id, user_id, movie_id, vendor_id, rating, review, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
      [review.id, review.bookingId, review.userId, review.movieId, review.vendorId, review.rating, review.review]
    );

    const [reviews] = await pool.query("SELECT * FROM movie_reviews WHERE movie_id = ? AND status = 'published'", [movie._id]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((item) => {
      const key = Math.max(1, Math.min(5, Math.round(Number(item.rating || 0))));
      distribution[key] += 1;
    });
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1))
      : 0;

    const updatedMovie = await Movie.findByIdAndUpdate(movie._id, {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      rating: averageRating ? `${averageRating}/5` : "",
    }, { new: true });

    emitVendorUpdated(movie.vendorId || movie.vendor, "movieRatingUpdated", { movie: updatedMovie, review });
    res.status(201).json({ message: "Review submitted", review, movie: updatedMovie });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD */

router.post(
  "/add-movie",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {
      const validationMessage = validateMoviePayload(req.body);
      if (validationMessage) return res.status(400).json({ message: validationMessage });
      const vendorId = req.user.role === "admin"
        ? req.body.vendorId || req.body.vendor_id || req.body.vendor || req.user.id
        : req.user.id;

      const movie =
      new Movie({
        ...req.body,
        vendor: vendorId,
        vendorId,
      });

      await movie.save();

      res.json(movie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* UPDATE */

router.put(
  "/edit-movie/:id",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {
      const validationMessage = validateMoviePayload(req.body);
      if (validationMessage) return res.status(400).json({ message: validationMessage });

      const updatedMovie =
      await Movie.findOneAndUpdate(

        {
          _id: req.params.id,
          ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
        },

        req.body,

        { new:true }

      );

      res.json(updatedMovie);

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

/* DELETE */

router.delete(
  "/delete-movie/:id",
  requireAuth,
  requireRole("admin", "vendor"),

  async (req, res) => {

    try {

      await Movie.findOneAndDelete({
        _id: req.params.id,
        ...(req.user.role === "admin" ? {} : { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] }),
      });

      res.json({
        success:true,
      });

    } catch (error) {

      res.status(500).json({
        message:error.message,
      });

    }

  }
);

module.exports = router;
