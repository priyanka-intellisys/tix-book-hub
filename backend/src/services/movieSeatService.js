const Movie = require("../models/Movie");
const { pool, ready } = require("../config/db");
const { emitSeatUpdated } = require("../socket");

const seatNo = (value) => String(value || "").trim().toUpperCase();

const makeShowId = ({ showId, movieId }) => String(showId || movieId || "").trim();

const rowNameForIndex = (index) => {
  let value = Number(index);
  let label = "";
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
};

const mapSeat = (row) => ({
  seatNo: row.seat_no,
  rowName: row.row_name || String(row.seat_no || "").slice(0, 1),
  seatNumber: row.seat_number || String(row.seat_no || "").slice(1),
  seatType: row.seat_type || "regular",
  category: row.category || String(row.seat_type || "regular").toUpperCase(),
  price: Number(row.price || row.amount || 0),
  showId: row.show_id,
  movieId: row.movie_id,
  theatreId: row.theatre_id,
  screenId: row.screen_id,
  status: row.status,
  bookedBy: row.booked_by,
  bookingId: row.booking_id,
  customerName: row.customer_name || "",
  customerEmail: row.customer_email || "",
  customerMobile: row.customer_mobile || "",
  mobile: row.customer_mobile || "",
  email: row.customer_email || "",
  amount: Number(row.price || row.amount || 0),
  paymentStatus: row.payment_status || "",
  bookingStatus: row.booking_status || "",
  bookingDate: row.booking_date || "",
  blockedBy: row.blocked_by,
  blockedReason: row.blocked_reason || "",
  updatedAt: row.updated_at,
});

const numberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const normalizeRowLabel = (value) => String(value || "").trim().toUpperCase();

const normalizeSeatList = (value) => {
  if (Array.isArray(value)) return value.map(seatNo).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(seatNo).filter(Boolean);
  } catch {
    // Fall through to comma-separated parsing.
  }
  return String(value).split(",").map(seatNo).filter(Boolean);
};

const rowIndexForName = (label) => {
  const value = normalizeRowLabel(label);
  if (!/^[A-Z]+$/.test(value)) return -1;
  return value.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
};

const rowRangeLabels = (start, end) => {
  const startIndex = rowIndexForName(start);
  const endIndex = rowIndexForName(end);
  if (startIndex < 0 || endIndex < startIndex) return [];
  return Array.from({ length: endIndex - startIndex + 1 }, (_, index) => rowNameForIndex(startIndex + index));
};

const normalizeCategory = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "premium" || raw === "prime") return "premium";
  if (raw === "vip") return "vip";
  return "regular";
};

const layoutFromContext = (context = {}, movie = null) => {
  const rawLayout = firstValue(context.layout, context.seatLayout, context.screenSeatLayout);
  if (Array.isArray(rawLayout) && rawLayout.length) return rawLayout;
  if (typeof rawLayout === "string" && rawLayout.trim()) {
    try {
      const parsed = JSON.parse(rawLayout);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }

  const vipStart = firstValue(context.vipRowsStart, context.vip_rows_start);
  const vipEnd = firstValue(context.vipRowsEnd, context.vip_rows_end);
  const premiumStart = firstValue(context.premiumRowsStart, context.premium_rows_start, context.primeRowsStart, context.prime_rows_start);
  const premiumEnd = firstValue(context.premiumRowsEnd, context.premium_rows_end, context.primeRowsEnd, context.prime_rows_end);
  const regularStart = firstValue(context.regularRowsStart, context.regular_rows_start);
  const regularEnd = firstValue(context.regularRowsEnd, context.regular_rows_end);

  if (!vipStart && !premiumStart && !regularStart) return [];

  return [
    {
      category: "VIP",
      rowStart: vipStart,
      rowEnd: vipEnd,
      seatsPerRow: firstValue(context.vipSeatsPerRow, context.vip_seats_per_row),
      price: firstValue(context.vipPrice, context.vip_price, context.vipSeatPrice, movie?.vipSeatPrice),
      expectedSeats: firstValue(context.vipSeatCount, context.vipSeats, context.vip_seat_count, context.vip_seats),
    },
    {
      category: "PREMIUM",
      rowStart: premiumStart,
      rowEnd: premiumEnd,
      seatsPerRow: firstValue(context.premiumSeatsPerRow, context.premium_seats_per_row, context.primeSeatsPerRow, context.prime_seats_per_row),
      price: firstValue(context.premiumPrice, context.premium_price, context.primePrice, context.prime_price, context.premiumSeatPrice, movie?.premiumSeatPrice),
      expectedSeats: firstValue(context.primeSeatCount, context.primeSeats, context.premiumSeatCount, context.premiumSeats, context.prime_seat_count, context.prime_seats),
    },
    {
      category: "REGULAR",
      rowStart: regularStart,
      rowEnd: regularEnd,
      seatsPerRow: firstValue(context.regularSeatsPerRow, context.regular_seats_per_row),
      price: firstValue(context.regularPrice, context.regular_price, context.regularSeatPrice, movie?.regularSeatPrice, context.price, movie?.ticketPrice),
      expectedSeats: firstValue(context.regularSeatCount, context.regularSeats, context.regular_seat_count, context.regular_seats),
    },
  ].filter((item) => item.rowStart && item.rowEnd);
};

const validateAndBuildLayoutSeats = (layout, totalSeats) => {
  const usedRows = new Set();
  const seats = [];

  layout.forEach((section) => {
    const category = normalizeCategory(section.category || section.seatType);
    const rows = rowRangeLabels(section.rowStart || section.row_start, section.rowEnd || section.row_end);
    const seatsPerRow = numberValue(firstValue(section.seatsPerRow, section.seats_per_row), 0);
    const price = numberValue(section.price, 0);

    if (!rows.length) {
      const error = new Error("Invalid row range");
      error.statusCode = 400;
      throw error;
    }
    if (seatsPerRow <= 0) {
      const error = new Error("Seats per row must be greater than 0");
      error.statusCode = 400;
      throw error;
    }

    rows.forEach((rowName) => {
      if (usedRows.has(rowName)) {
        const error = new Error("Row ranges should not overlap");
        error.statusCode = 400;
        throw error;
      }
      usedRows.add(rowName);
      for (let seatIndex = 1; seatIndex <= seatsPerRow; seatIndex += 1) {
        const seatNumber = String(seatIndex).padStart(2, "0");
        seats.push({
          rowName,
          seatNumber,
          seatNo: `${rowName}${seatNumber}`,
          seatType: category,
          category: category.toUpperCase(),
          price,
          status: "available",
        });
      }
    });
  });

  return seats;
};

const hasCategoryCounts = (context = {}, movie = null) => [
  context.vipSeats,
  context.vip_seats,
  context.primeSeats,
  context.prime_seats,
  context.regularSeats,
  context.regular_seats,
  movie?.vipSeats,
  movie?.primeSeats,
  movie?.regularSeats,
].some((value) => value !== undefined && value !== null && value !== "");

const seatCategoriesFromContext = (context = {}, movie = null) => {
  const total = Math.max(numberValue(firstValue(context.totalSeats, context.total_seats, movie?.totalSeats), 0), 0);
  const explicitCounts = hasCategoryCounts(context, movie);
  const categories = [
    {
      key: "vip",
      label: "VIP",
      count: numberValue(firstValue(context.vipSeats, context.vip_seats, movie?.vipSeats), 0),
      price: numberValue(firstValue(context.vipPrice, context.vip_price, context.vipSeatPrice, movie?.vipSeatPrice, context.price, movie?.ticketPrice), 0),
    },
    {
      key: "prime",
      label: "Prime",
      count: numberValue(firstValue(context.primeSeats, context.prime_seats, movie?.primeSeats), 0),
      price: numberValue(firstValue(context.primePrice, context.prime_price, context.premiumSeatPrice, movie?.premiumSeatPrice, context.price, movie?.ticketPrice), 0),
    },
    {
      key: "regular",
      label: "Regular",
      count: explicitCounts
        ? numberValue(firstValue(context.regularSeats, context.regular_seats, movie?.regularSeats), 0)
        : total,
      price: numberValue(firstValue(context.regularPrice, context.regular_price, context.regularSeatPrice, movie?.regularSeatPrice, context.price, movie?.ticketPrice), 0),
    },
  ];
  const categoryTotal = categories.reduce((sum, category) => sum + category.count, 0);

  if (explicitCounts && total !== categoryTotal) {
    const error = new Error("Total seats must match category seat count");
    error.statusCode = 400;
    throw error;
  }

  return categories.filter((category) => category.count > 0);
};

const buildSeatLayout = (context = {}, movie = null) => {
  const total = Math.max(numberValue(firstValue(context.totalSeats, context.total_seats, movie?.totalSeats), 0), 0);
  const configuredLayout = layoutFromContext(context, movie);
  if (configuredLayout.length) return validateAndBuildLayoutSeats(configuredLayout, total);

  const configuredSeatsPerRow = Math.max(numberValue(firstValue(context.seatsPerRow, context.seats_per_row), 10), 1);
  const categories = seatCategoriesFromContext(context, movie);
  const seats = [];
  let rowIndex = 0;

  categories.forEach((category) => {
    let categorySeatIndex = 0;
    while (categorySeatIndex < category.count) {
      const rowName = rowNameForIndex(rowIndex);
      const seatsInRow = Math.min(configuredSeatsPerRow, category.count - categorySeatIndex);
      for (let seatIndex = 1; seatIndex <= seatsInRow; seatIndex += 1) {
        const seatNumber = String(seatIndex).padStart(2, "0");
        seats.push({
          rowName,
          seatNumber,
          seatNo: `${rowName}${seatNumber}`,
          seatType: category.key === "prime" ? "premium" : category.key,
          category: category.label,
          price: category.price,
          status: "available",
        });
      }
      categorySeatIndex += seatsInRow;
      rowIndex += 1;
    }
  });

  return seats;
};

const visibleRowBounds = (context = {}) => {
  const start = firstValue(context.todayVisibleRowStart, context.today_visible_row_start, context.visibleRowStart, context.visible_row_start);
  const end = firstValue(context.todayVisibleRowEnd, context.today_visible_row_end, context.visibleRowEnd, context.visible_row_end);
  const startIndex = rowIndexForName(start);
  const endIndex = rowIndexForName(end);
  if (startIndex < 0 || endIndex < startIndex) return null;
  return { startIndex, endIndex };
};

const filterVisibleSeats = (seats, context = {}) => {
  const bounds = visibleRowBounds(context);
  if (!bounds) return seats;
  return seats.filter((seat) => {
    const index = rowIndexForName(seat.rowName);
    return index >= bounds.startIndex && index <= bounds.endIndex;
  });
};

const ensureShowSeats = async (context = {}) => {
  await ready;
  const showId = makeShowId(context);
  if (!showId) throw new Error("showId is required");

  const movie = context.movieId ? await Movie.findById(context.movieId) : null;
  let screenContext = {};
  if (context.screenId) {
    const [screenRows] = await pool.query("SELECT * FROM movie_screens WHERE id = ? LIMIT 1", [context.screenId]);
    const screen = screenRows[0];
    if (screen) {
      const [layoutRows] = await pool.query(
        "SELECT * FROM screen_seat_layouts WHERE screen_id = ? ORDER BY FIELD(category, 'VIP', 'PREMIUM', 'REGULAR'), row_start",
        [context.screenId]
      );
      screenContext = {
        rows: screen.rows_count,
        seatsPerRow: screen.seats_per_row,
        totalSeats: screen.total_seats,
        layout: layoutRows.map((row) => ({
          category: row.category,
          rowStart: row.row_start,
          rowEnd: row.row_end,
          seatsPerRow: row.seats_per_row,
          price: row.price,
          expectedSeats: row.expected_seats,
        })),
        vipSeats: screen.vip_seats,
        primeSeats: screen.prime_seats,
        regularSeats: screen.regular_seats,
        vipPrice: screen.vip_price,
        primePrice: screen.prime_price,
        regularPrice: screen.regular_price,
        visibleRowStart: screen.visible_row_start,
        visibleRowEnd: screen.visible_row_end,
      };
    }
  }
  const layoutContext = { ...screenContext, ...context };
  const seats = buildSeatLayout(layoutContext, movie);

  await pool.query(
    `INSERT INTO seats (
      row_name, row_label, seat_number, seat_no, seat_code, show_id, movie_id, theatre_id, screen_id, seat_type, category, price
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      row_name = VALUES(row_name),
      row_label = VALUES(row_label),
      seat_number = VALUES(seat_number),
      seat_code = VALUES(seat_code),
      screen_id = VALUES(screen_id),
      seat_type = IF(status = 'available', VALUES(seat_type), seat_type),
      category = IF(status = 'available', VALUES(category), category),
      price = IF(status = 'available', VALUES(price), price)`,
    [seats.map((seat) => [
      seat.rowName,
      seat.rowName,
      seat.seatNumber,
      seat.seatNo,
      seat.seatNo,
      showId,
      layoutContext.movieId || null,
      layoutContext.theatreId || layoutContext.theatre || null,
      layoutContext.screenId || "Screen 1",
      seat.seatType,
      seat.category || seat.seatType.toUpperCase(),
      seat.price,
    ])]
  );

  const desiredSeatNumbers = seats.map((seat) => seat.seatNo);
  if (desiredSeatNumbers.length) {
    await pool.query(
      "DELETE FROM seats WHERE show_id = ? AND status = 'available' AND seat_no NOT IN (?)",
      [showId, desiredSeatNumbers]
    );
  }

  const blockedSeats = normalizeSeatList(firstValue(context.blockedSeats, context.blocked_seats, movie?.blockedSeats));
  if (blockedSeats.length) {
    await pool.query(
      `UPDATE seats
       SET status = 'blocked',
           blocked_by = COALESCE(blocked_by, ?),
           blocked_reason = COALESCE(NULLIF(blocked_reason, ''), 'Blocked before saving movie')
       WHERE show_id = ? AND seat_no IN (?) AND status = 'available'`,
      [layoutContext.vendorId || movie?.vendorId || movie?.vendor || null, showId, blockedSeats]
    );
  }

  return { showId, movie };
};

const getShowSeats = async (context = {}) => {
  const { showId } = await ensureShowSeats(context);
  const [rows] = await pool.query(
    "SELECT * FROM seats WHERE show_id = ? ORDER BY row_name, CAST(seat_number AS UNSIGNED), seat_no",
    [showId]
  );
  return filterVisibleSeats(rows.map(mapSeat), context);
};

const validateMovieSeatsAvailable = async (context, seats) => {
  const { showId } = await ensureShowSeats(context);
  const requestedSeats = seats.map(seatNo).filter(Boolean);
  if (!requestedSeats.length) throw new Error("At least one seat is required");

  const [rows] = await pool.query("SELECT seat_no, status FROM seats WHERE show_id = ? AND seat_no IN (?)", [showId, requestedSeats]);
  const statusBySeat = new Map(rows.map((row) => [row.seat_no, row.status]));
  const visibleSeats = filterVisibleSeats(requestedSeats.map((number) => ({ seatNo: number, rowName: String(number).replace(/\d/g, "") })), context);
  const visibleSeatSet = new Set(visibleSeats.map((seat) => seat.seatNo));
  const hasVisibleLimit = Boolean(visibleRowBounds(context));
  const unavailable = requestedSeats.filter((number) => !statusBySeat.has(number) || statusBySeat.get(number) !== "available" || (hasVisibleLimit && !visibleSeatSet.has(number)));

  if (unavailable.length) {
    const error = new Error(`Seats unavailable: ${unavailable.join(", ")}`);
    error.statusCode = 409;
    throw error;
  }
};

const markMovieSeatsBooked = async (context, seats, booking, customer) => {
  const { showId } = await ensureShowSeats(context);
  const requestedSeats = seats.map(seatNo).filter(Boolean);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT seat_no, status FROM seats WHERE show_id = ? AND seat_no IN (?) FOR UPDATE",
      [showId, requestedSeats]
    );
    const statusBySeat = new Map(rows.map((row) => [row.seat_no, row.status]));
    const visibleSeats = filterVisibleSeats(requestedSeats.map((number) => ({ seatNo: number, rowName: String(number).replace(/\d/g, "") })), context);
    const visibleSeatSet = new Set(visibleSeats.map((seat) => seat.seatNo));
    const hasVisibleLimit = Boolean(visibleRowBounds(context));
    const unavailable = requestedSeats.filter((number) => !statusBySeat.has(number) || statusBySeat.get(number) !== "available" || (hasVisibleLimit && !visibleSeatSet.has(number)));

    if (unavailable.length) {
      const error = new Error(`Seats unavailable: ${unavailable.join(", ")}`);
      error.statusCode = 409;
      throw error;
    }

    await connection.query(
      `UPDATE seats
       SET status = 'booked',
           booked_by = ?,
           booking_id = ?,
           blocked_by = NULL,
           blocked_reason = NULL
       WHERE show_id = ? AND seat_no IN (?)`,
      [
        booking.user,
        booking.bookingId || booking.bookingCode || booking._id,
        showId,
        requestedSeats,
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [updatedRows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no IN (?)", [showId, requestedSeats]);
  updatedRows.map(mapSeat).forEach(emitSeatUpdated);
  return updatedRows.map(mapSeat);
};

const releaseMovieSeats = async (context, seats) => {
  const { showId } = await ensureShowSeats(context);
  const requestedSeats = seats.map(seatNo).filter(Boolean);
  if (!requestedSeats.length) return [];

  await pool.query(
    `UPDATE seats
     SET status = 'available',
         booked_by = NULL,
         booking_id = NULL,
         blocked_reason = NULL
     WHERE show_id = ? AND seat_no IN (?) AND status = 'booked'`,
    [showId, requestedSeats]
  );

  const [updatedRows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no IN (?)", [showId, requestedSeats]);
  updatedRows.map(mapSeat).forEach(emitSeatUpdated);
  return updatedRows.map(mapSeat);
};

const setMovieSeatBlocked = async (context, seatNumber, user, reason = "") => {
  const { showId } = await ensureShowSeats(context);
  const normalizedSeat = seatNo(seatNumber);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT * FROM seats WHERE show_id = ? AND seat_no = ? FOR UPDATE",
      [showId, normalizedSeat]
    );
    const current = rows[0];
    if (!current) {
      const error = new Error("Seat not found");
      error.statusCode = 404;
      throw error;
    }
    if (current.status === "booked") {
      const error = new Error("Booked seat cannot be blocked");
      error.statusCode = 409;
      throw error;
    }

    await connection.query(
      `UPDATE seats
       SET status = 'blocked', blocked_by = ?, blocked_reason = ?, booking_id = NULL
       WHERE show_id = ? AND seat_no = ?`,
      [user.id, reason || "Blocked by vendor", showId, normalizedSeat]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [rows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const seat = mapSeat(rows[0]);
  emitSeatUpdated(seat);
  return seat;
};

const setMovieSeatAvailable = async (context, seatNumber) => {
  const { showId } = await ensureShowSeats(context);
  const normalizedSeat = seatNo(seatNumber);
  const [rows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const current = rows[0];

  if (!current) {
    const error = new Error("Seat not found");
    error.statusCode = 404;
    throw error;
  }
  if (current.status === "booked") {
    const error = new Error("Booked seat cannot be unblocked");
    error.statusCode = 409;
    throw error;
  }

  await pool.query(
    `UPDATE seats
     SET status = 'available',
         blocked_by = NULL,
         blocked_reason = NULL
     WHERE show_id = ? AND seat_no = ?`,
    [showId, normalizedSeat]
  );

  const [updatedRows] = await pool.query("SELECT * FROM seats WHERE show_id = ? AND seat_no = ?", [showId, normalizedSeat]);
  const seat = mapSeat(updatedRows[0]);
  emitSeatUpdated(seat);
  return seat;
};

module.exports = {
  ensureShowSeats,
  getShowSeats,
  makeShowId,
  markMovieSeatsBooked,
  releaseMovieSeats,
  setMovieSeatAvailable,
  setMovieSeatBlocked,
  validateMovieSeatsAvailable,
};
