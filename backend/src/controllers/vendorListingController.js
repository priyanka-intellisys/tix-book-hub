const VendorListing = require("../models/VendorListing");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Movie = require("../models/Movie");
const fs = require("fs");
const path = require("path");
const PaymentDetail = require("../models/PaymentDetail");
const MovieReview = require("../models/MovieReview");
const MovieDocument = require("../models/MovieDocument");
const MovieGallery = require("../models/MovieGallery");
const Theatre = require("../models/Theatre");
const Screen = require("../models/Screen");
const Show = require("../models/Show");
const SeatBlock = require("../models/SeatBlock");
const { emitVendorUpdated } = require("../socket");
const { createNotification } = require("../services/notificationService");
const {
  getShowSeats: getDatabaseShowSeats,
  setMovieSeatAvailable,
  setMovieSeatBlocked,
  ensureShowSeats,
} = require("../services/movieSeatService");

const moduleTitles = {
  flight: "airlineName",
  hotel: "hotelName",
  event: "eventTitle",
  bus: "operatorName",
  "travel-package": "packageTitle",
};

const modulePriceFields = {
  flight: "ticketPrice",
  hotel: "pricePerNight",
  event: "ticketPrice",
  bus: "price",
  "travel-package": "pricePerPerson",
};

const moduleInventoryFields = {
  flight: "totalSeats",
  hotel: "availableRooms",
  event: "totalTickets",
  bus: "seatCount",
  "travel-package": "totalSeats",
};

const supportedBookingModules = ["movie", "flight", "hotel", "event", "bus", "travel-package"];

const vendorQuery = (req) => {
  if (req.user.role === "admin") return {};
  return { $or: [{ vendor: req.user.id }, { vendorId: req.user.id }] };
};

const selectedVendorId = (req) => (
  req.user.role === "admin"
    ? req.body.vendorId || req.body.vendor_id || req.body.vendor || req.user.id
    : req.user.id
);

const vendorPayload = (req) => {
  const vendorId = selectedVendorId(req);
  return {
    vendor: vendorId,
    vendorId,
  };
};

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

const rowEndFromStart = (start, rows) => {
  const rowCount = Math.max(numberValue(rows), 0);
  if (!start || rowCount <= 0) return "";
  const startIndex = String(start).toUpperCase().split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
  return startIndex >= 0 ? rowNameForIndex(startIndex + rowCount - 1) : "";
};

const buildScreenCategories = (body = {}, fallback = {}) => {
  const hasExplicitCounts = [
    body.vipSeats,
    body.vip_seats,
    body.primeSeats,
    body.prime_seats,
    body.regularSeats,
    body.regular_seats,
    fallback.vipSeats,
    fallback.primeSeats,
    fallback.regularSeats,
  ].some((value) => value !== undefined && value !== null && value !== "");
  const totalSeats = numberValue(body.totalSeats || body.total_seats || fallback.totalSeats || fallback.total_seats);
  const vipSeats = numberValue(body.vipSeats || body.vip_seats || fallback.vipSeats || fallback.vip_seats);
  const primeSeats = numberValue(body.primeSeats || body.prime_seats || fallback.primeSeats || fallback.prime_seats);
  const regularSeats = hasExplicitCounts
    ? numberValue(body.regularSeats || body.regular_seats || fallback.regularSeats || fallback.regular_seats)
    : Math.max(totalSeats - vipSeats - primeSeats, 0);
  if (totalSeats && totalSeats !== vipSeats + primeSeats + regularSeats) {
    const error = new Error("Total seats must match category seat count");
    error.statusCode = 400;
    throw error;
  }
  return {
    totalSeats,
    vipSeats,
    primeSeats,
    regularSeats,
    vipPrice: numberValue(body.vipPrice || body.vip_price || body.vipSeatPrice || fallback.vipPrice),
    primePrice: numberValue(body.primePrice || body.prime_price || body.premiumSeatPrice || fallback.primePrice),
    regularPrice: numberValue(body.regularPrice || body.regular_price || body.regularSeatPrice || fallback.regularPrice),
  };
};

const movieStatuses = ["draft", "upcoming", "booking_open", "now_showing", "house_full", "ended", "cancelled", "active", "inactive", "hidden"];

const normalizeMovieStatus = (status) => {
  const value = String(status || "draft").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return movieStatuses.includes(value) ? value : "draft";
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
};

const uploadRoot = path.join(__dirname, "..", "..", "uploads", "movies");

const publicUrl = (req, filePath) => {
  const relative = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${relative}`;
};

const saveUploadedFile = (req, file, folder) => {
  if (!file?.data || !file?.name) return null;
  const mime = String(file.type || "");
  const extension = path.extname(file.name) || `.${(mime.split("/")[1] || "bin").replace("quicktime", "mov")}`;
  const safeBase = path.basename(file.name, extension).replace(/[^a-z0-9_-]/gi, "-").slice(0, 48) || "file";
  const directory = path.join(uploadRoot, folder);
  fs.mkdirSync(directory, { recursive: true });
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${safeBase}${extension}`;
  const filePath = path.join(directory, fileName);
  const buffer = Buffer.from(String(file.data).split(",").pop(), "base64");
  fs.writeFileSync(filePath, buffer);
  return { fileName: file.name, fileUrl: publicUrl(req, filePath), mimeType: mime };
};

const generateSeatLayout = (totalSeats, prices = {}) => {
  const total = Math.max(numberValue(totalSeats) || 1, 1);
  const blockedSeats = new Set(normalizeArray(prices.blockedSeats).map((seat) => String(seat).toUpperCase()));
  const categories = [
    {
      sectionName: "VIP Rows",
      seatType: "vip",
      rows: numberValue(prices.vipRows),
      seatsPerRow: numberValue(prices.vipSeatsPerRow),
      count: numberValue(prices.vipSeats),
      price: numberValue(prices.vipSeatPrice),
    },
    {
      sectionName: "Prime Rows",
      seatType: "prime",
      rows: numberValue(prices.primeRows),
      seatsPerRow: numberValue(prices.primeSeatsPerRow),
      count: numberValue(prices.primeSeats),
      price: numberValue(prices.premiumSeatPrice || prices.primePrice),
    },
    {
      sectionName: "Regular Rows",
      seatType: "regular",
      rows: numberValue(prices.regularRows),
      seatsPerRow: numberValue(prices.regularSeatsPerRow),
      count: numberValue(prices.regularSeats) || total,
      price: numberValue(prices.regularSeatPrice || prices.ticketPrice),
    },
  ].map((section) => ({
    ...section,
    count: section.rows && section.seatsPerRow ? section.rows * section.seatsPerRow : section.count,
    seatsPerRow: section.seatsPerRow || numberValue(prices.seatsPerRow) || 10,
  })).filter((section) => section.count > 0);
  const layout = [];
  let rowIndex = 0;

  categories.forEach((section) => {
    const rows = [];
    let created = 0;
    const seatsPerRow = Math.max(section.seatsPerRow || 10, 1);
    while (created < section.count) {
      const rowName = rowNameForIndex(rowIndex);
      const seatsInRow = Math.min(seatsPerRow, section.count - created);
      const seats = Array.from({ length: seatsInRow }, (_, index) => {
        const seatNumber = String(index + 1).padStart(2, "0");
        const seatNo = `${rowName}${seatNumber}`;
        return {
          row_name: rowName,
          seat_number: seatNumber,
          seat_no: seatNo,
          seat_type: section.seatType,
          price: section.price,
          status: blockedSeats.has(seatNo) ? "blocked" : "available",
        };
      });
      rows.push({ row_name: rowName, seats });
      created += seats.length;
      rowIndex += 1;
    }
    if (rows.length) {
      layout.push({
        section_name: section.sectionName,
        seat_type: section.seatType,
        price: section.price,
        rows,
      });
    }
  });

  return layout;
};

const makeSummary = (module, details) => {
  const rawTitle = String(details[moduleTitles[module]] || "").trim();
  const title = rawTitle || "Untitled listing";
  const price = numberValue(details[modulePriceFields[module]] || details.price);
  const inventory = numberValue(details[moduleInventoryFields[module]] || details.availableSeats);
  const imageUrl = String(details.imageUrl || details.bannerImageUrl || "").trim();

  const route = module === "flight"
    ? [details.fromCity || details.fromAirport, details.toCity || details.toAirport].filter(Boolean).join(" to ")
    : module === "bus"
      ? [details.fromCity, details.toCity].filter(Boolean).join(" to ")
      : module === "travel-package"
        ? String(details.destination || "").trim()
        : String(details.city || "").trim();

  return {
    title,
    price,
    inventory,
    imageUrl: String(details.airlineLogoUrl || imageUrl || "").trim(),
    route,
    city: details.city || details.destination || "",
  };
};

const validateListingPayload = (module, details) => {
  if (!module || !details || !moduleTitles[module]) {
    return "Valid module and details are required";
  }

  return "";
};

const validateMoviePayload = (body) => {
  const requiredFields = [
    ["title", "Movie title"],
    ["language", "Language"],
    ["duration", "Duration"],
    ["theatre", "Theatre"],
    ["genre", "Genre"],
    ["releaseDate", "Release date"],
  ];

  for (const [field, label] of requiredFields) {
    if (!String(body[field] || "").trim()) return `${label} is required`;
  }

  if (!String(body.image || body.posterUrl || "").trim()) return "Movie poster is required";
  if (Number(body.ticketPrice || body.regularSeatPrice) <= 0) return "Ticket price must be greater than 0";
  if (Number(body.totalSeats) <= 0) return "Total seats must be greater than 0";

  return "";
};

const prepareMoviePayload = (req, existing = {}) => {
  const uploads = req.body.uploads || {};
  const poster = saveUploadedFile(req, uploads.poster, "posters");
  const banner = saveUploadedFile(req, uploads.banner, "banners");
  const trailer = saveUploadedFile(req, uploads.trailer, "trailers");
  const galleryUploads = normalizeArray(uploads.gallery).map((file) => saveUploadedFile(req, file, "gallery")).filter(Boolean);
  const documentUploads = normalizeArray(uploads.documents).map((entry) => {
    const saved = saveUploadedFile(req, entry.file || entry, "documents");
    if (!saved) return null;
    return { ...saved, documentType: entry.documentType || entry.type || "Other Supporting Documents" };
  }).filter(Boolean);

  const galleryImages = [...normalizeArray(existing.galleryImages), ...normalizeArray(req.body.galleryImages), ...galleryUploads];
  const documents = [...normalizeArray(existing.documents), ...normalizeArray(req.body.documents), ...documentUploads];
  const regularSeatPrice = numberValue(req.body.regularSeatPrice || req.body.ticketPrice || existing.regularSeatPrice || existing.ticketPrice || 0);
  const regularRows = numberValue(req.body.regularRows || existing.regularRows || 0);
  const regularSeatsPerRow = numberValue(req.body.regularSeatsPerRow || existing.regularSeatsPerRow || 0);
  const primeRows = numberValue(req.body.primeRows || existing.primeRows || 0);
  const primeSeatsPerRow = numberValue(req.body.primeSeatsPerRow || existing.primeSeatsPerRow || 0);
  const vipRows = numberValue(req.body.vipRows || existing.vipRows || 0);
  const vipSeatsPerRow = numberValue(req.body.vipSeatsPerRow || existing.vipSeatsPerRow || 0);
  const regularSeatCount = regularRows && regularSeatsPerRow ? regularRows * regularSeatsPerRow : numberValue(req.body.regularSeatCount || req.body.regularSeats || existing.regularSeatCount || existing.regularSeats || 0);
  const primeSeatCount = primeRows && primeSeatsPerRow ? primeRows * primeSeatsPerRow : numberValue(req.body.primeSeatCount || req.body.primeSeats || existing.primeSeatCount || existing.primeSeats || 0);
  const vipSeatCount = vipRows && vipSeatsPerRow ? vipRows * vipSeatsPerRow : numberValue(req.body.vipSeatCount || req.body.vipSeats || existing.vipSeatCount || existing.vipSeats || 0);
  const totalSeats = numberValue(req.body.totalSeats || existing.totalSeats || regularSeatCount + primeSeatCount + vipSeatCount || 120);
  const blockedSeats = normalizeArray(req.body.blockedSeats || existing.blockedSeats);
  const theatreName = req.body.theatreName || req.body.theatre || existing.theatreName || existing.theatre || "";
  const vipRowsStart = req.body.vipRowsStart || existing.vipRowsStart || (vipRows ? "A" : "");
  const vipRowsEnd = req.body.vipRowsEnd || existing.vipRowsEnd || rowEndFromStart(vipRowsStart, vipRows);
  const primeStartIndex = vipRows;
  const primeRowsStart = req.body.primeRowsStart || req.body.premiumRowsStart || existing.primeRowsStart || existing.premiumRowsStart || (primeRows ? rowNameForIndex(primeStartIndex) : "");
  const primeRowsEnd = req.body.primeRowsEnd || req.body.premiumRowsEnd || existing.primeRowsEnd || existing.premiumRowsEnd || rowEndFromStart(primeRowsStart, primeRows);
  const regularStartIndex = vipRows + primeRows;
  const regularRowsStart = req.body.regularRowsStart || existing.regularRowsStart || (regularRows ? rowNameForIndex(regularStartIndex) : "");
  const regularRowsEnd = req.body.regularRowsEnd || existing.regularRowsEnd || rowEndFromStart(regularRowsStart, regularRows);

  return {
    ...req.body,
    uploads: undefined,
    title: req.body.title || req.body.movieName || existing.title || "",
    image: poster?.fileUrl || req.body.image || req.body.posterUrl || existing.image || existing.posterUrl || "",
    posterUrl: poster?.fileUrl || req.body.posterUrl || req.body.image || existing.posterUrl || existing.image || "",
    bannerUrl: banner?.fileUrl || req.body.bannerUrl || existing.bannerUrl || "",
    trailerFileUrl: trailer?.fileUrl || req.body.trailerFileUrl || existing.trailerFileUrl || "",
    galleryImages,
    documents,
    theatre: theatreName,
    theatreName,
    screenName: req.body.screenName || req.body.screenNumber || existing.screenName || existing.screenNumber || "",
    screenNumber: req.body.screenNumber || req.body.screenName || existing.screenNumber || existing.screenName || "",
    theatreCity: req.body.city || req.body.theatreCity || existing.theatreCity || "",
    theatreAddress: req.body.location || req.body.theatreAddress || existing.theatreAddress || "",
    city: req.body.city || req.body.theatreCity || existing.city || existing.theatreCity || "",
    location: req.body.location || req.body.theatreAddress || existing.location || existing.theatreAddress || "",
    showTimes: normalizeArray(req.body.showTimes || (req.body.showTime ? [req.body.showTime] : existing.showTimes)),
    totalSeats,
    regularSeatCount,
    primeSeatCount,
    vipSeatCount,
    regularSeats: regularSeatCount,
    primeSeats: primeSeatCount,
    vipSeats: vipSeatCount,
    regularRows,
    regularSeatsPerRow,
    primeRows,
    primeSeatsPerRow,
    vipRows,
    vipSeatsPerRow,
    regularRowsStart,
    regularRowsEnd,
    primeRowsStart,
    primeRowsEnd,
    premiumRowsStart: primeRowsStart,
    premiumRowsEnd: primeRowsEnd,
    vipRowsStart,
    vipRowsEnd,
    blockedSeats,
    ticketPrice: regularSeatPrice,
    regularSeatPrice,
    premiumSeatPrice: numberValue(req.body.premiumSeatPrice || existing.premiumSeatPrice || 0),
    vipSeatPrice: numberValue(req.body.vipSeatPrice || existing.vipSeatPrice || 0),
    status: normalizeMovieStatus(req.body.status || existing.status),
    seatLayout: normalizeArray(req.body.seatLayout).length
      ? normalizeArray(req.body.seatLayout)
      : generateSeatLayout(totalSeats, {
        regularSeatPrice,
        premiumSeatPrice: req.body.premiumSeatPrice || existing.premiumSeatPrice,
        vipSeatPrice: req.body.vipSeatPrice || existing.vipSeatPrice,
        ticketPrice: req.body.ticketPrice || existing.ticketPrice,
        regularRows,
        regularSeatsPerRow,
        primeRows,
        primeSeatsPerRow,
        vipRows,
        vipSeatsPerRow,
        regularSeats: regularSeatCount,
        primeSeats: primeSeatCount,
        vipSeats: vipSeatCount,
        blockedSeats,
      }),
    averageRating: numberValue(existing.averageRating || req.body.averageRating || 0),
    totalReviews: numberValue(existing.totalReviews || req.body.totalReviews || 0),
    ratingDistribution: existing.ratingDistribution || req.body.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
};

const getVendorMovies = async (req, res) => {
  const movies = await Movie.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(movies);
};

const createVendorMovie = async (req, res) => {
  const payload = prepareMoviePayload(req);
  const validationMessage = validateMoviePayload(payload);
  if (validationMessage) return res.status(400).json({ message: validationMessage });

  const movie = await Movie.create({ ...payload, ...vendorPayload(req) });
  await ensureShowSeats({
    ...payload,
    showId: payload.showId || movie._id,
    movieId: movie._id,
    screenId: payload.screenNumber || payload.screenName || "Screen 1",
  });
  await Promise.all([
    ...normalizeArray(movie.galleryImages).map((item) => MovieGallery.create({ ...item, movieId: movie._id, ...vendorPayload(req) })),
    ...normalizeArray(movie.documents).map((item) => MovieDocument.create({ ...item, movieId: movie._id, ...vendorPayload(req) })),
  ]);
  emitVendorUpdated(req.user.id, "movieStatusUpdated", { movie });
  res.status(201).json({ message: "Movie created", movie });
};

const updateVendorMovie = async (req, res) => {
  const existing = await Movie.findOne({ _id: req.params.id, ...vendorQuery(req) });
  if (!existing) return res.status(404).json({ message: "Movie not found" });
  const payload = prepareMoviePayload(req, existing);
  const validationMessage = validateMoviePayload(payload);
  if (validationMessage) return res.status(400).json({ message: validationMessage });

  const movie = await Movie.findOneAndUpdate({ _id: req.params.id, ...vendorQuery(req) }, payload, { new: true });
  await ensureShowSeats({
    ...payload,
    showId: payload.showId || movie._id,
    movieId: movie._id,
    screenId: payload.screenNumber || payload.screenName || "Screen 1",
  });
  await Promise.all([
    ...normalizeArray(payload.galleryImages).map((item) => MovieGallery.create({ ...item, movieId: movie._id, ...vendorPayload(req) })),
    ...normalizeArray(payload.documents).map((item) => MovieDocument.create({ ...item, movieId: movie._id, ...vendorPayload(req) })),
  ]);
  emitVendorUpdated(req.user.id, "movieStatusUpdated", { movie });
  res.json({ message: "Movie updated", movie });
};

const deleteVendorMovie = async (req, res) => {
  const movie = await Movie.findOneAndDelete({ _id: req.params.id, ...vendorQuery(req) });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  res.json({ success: true });
};

const movieBookingFilter = (req, movieIds) => ({
  module: "movie",
  ...vendorQuery(req),
  $or: [
    { movieId: { $in: movieIds } },
    { "details.movieId": { $in: movieIds } },
    { "details.movie._id": { $in: movieIds } },
    { "details.movie.id": { $in: movieIds } },
  ],
});

const enrichMovieStats = async (req, movie) => {
  const bookings = await Booking.find(movieBookingFilter(req, [movie._id])).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  const reviews = await MovieReview.find({ movieId: movie._id }).sort({ createdAt: -1 });
  const totalSeats = numberValue(movie.totalSeats);
  const bookedSeats = bookings.reduce((sum, booking) => sum + normalizeArray(booking.seats).length, 0) || numberValue(movie.bookedSeats?.length);
  const revenue = bookings.reduce((sum, booking) => sum + numberValue(booking.amount), 0);
  return {
    ...movie.toObject?.() || movie,
    bookingsCount: bookings.length,
    revenue,
    bookedSeats,
    availableSeats: Math.max(totalSeats - bookedSeats, 0),
    occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
    reviews,
  };
};

const getVendorMovieDashboard = async (req, res) => {
  const movies = await Movie.find(vendorQuery(req)).sort({ createdAt: -1 });
  const movieIds = movies.map((movie) => movie._id);
  const [bookings, reviews] = await Promise.all([
    movieIds.length ? Booking.find(movieBookingFilter(req, movieIds)).populate("user", "name email mobile phone").sort({ createdAt: -1 }) : [],
    movieIds.length ? MovieReview.find({ movieId: { $in: movieIds } }).sort({ createdAt: -1 }) : [],
  ]);
  const totalSeats = movies.reduce((sum, movie) => sum + numberValue(movie.totalSeats), 0);
  const bookedSeatCount = bookings.reduce((sum, booking) => sum + normalizeArray(booking.seats).length, 0);
  const revenue = bookings.reduce((sum, booking) => sum + numberValue(booking.amount), 0);
  const activeStatuses = ["booking_open", "now_showing", "active"];
  const upcomingStatuses = ["upcoming", "draft"];
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + numberValue(review.rating), 0) / reviews.length).toFixed(1) : "0.0";

  res.json({
    stats: {
      totalMovies: movies.length,
      activeMovies: movies.filter((movie) => activeStatuses.includes(movie.status)).length,
      upcomingMovies: movies.filter((movie) => upcomingStatuses.includes(movie.status)).length,
      totalBookings: bookings.length,
      revenue,
      occupancy: totalSeats ? Math.round((bookedSeatCount / totalSeats) * 100) : 0,
      averageRating,
      totalReviews: reviews.length,
    },
    movies: await Promise.all(movies.map((movie) => enrichMovieStats(req, movie))),
    recentBookings: bookings.slice(0, 8),
    recentReviews: reviews.slice(0, 8),
  });
};

const getVendorMovieDetails = async (req, res) => {
  const movie = await Movie.findOne({ _id: req.params.id, ...vendorQuery(req) });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const [details, reviews] = await Promise.all([
    enrichMovieStats(req, movie),
    MovieReview.find({ movieId: movie._id }).sort({ createdAt: -1 }),
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    const rating = Math.max(1, Math.min(5, Math.round(numberValue(review.rating))));
    distribution[rating] += 1;
  });
  res.json({ ...details, ratingDistribution: distribution, totalReviews: reviews.length, reviews });
};

const getVendorListings = async (req, res) => {
  const query = vendorQuery(req);
  if (req.path.includes("/vendor/flights")) query.module = "flight";
  const listings = await VendorListing.find(query).sort({ createdAt: -1 });
  res.json(listings);
};

const createVendorListing = async (req, res) => {
  const { module, details } = req.body;
  console.log("[vendor-listings:create]", {
    userId: req.user?.id,
    role: req.user?.role,
    module,
    detailKeys: details ? Object.keys(details) : [],
  });

  const validationMessage = validateListingPayload(module, details);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const listing = await VendorListing.create({
    ...vendorPayload(req),
    module,
    details,
    ...makeSummary(module, details),
  });

  console.log("[vendor-listings:create:success]", listing._id.toString());
  res.status(201).json({ message: "Listing created", listing });
};

const updateVendorListing = async (req, res) => {
  const { module, details, status } = req.body;
  console.log("[vendor-listings:update]", {
    id: req.params.id,
    userId: req.user?.id,
    role: req.user?.role,
    module,
  });

  const validationMessage = validateListingPayload(module, details);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const listing = await VendorListing.findOneAndUpdate(
    { _id: req.params.id, ...vendorQuery(req) },
    {
      module,
      details,
      status: status || "active",
      ...makeSummary(module, details),
    },
    { new: true }
  );

  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json({ message: "Listing updated", listing });
};

const deleteVendorListing = async (req, res) => {
  const listing = await VendorListing.findOneAndDelete({ _id: req.params.id, ...vendorQuery(req) });

  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json({ success: true });
};

const getVendorBookings = async (req, res) => {
  const query = { module: { $in: supportedBookingModules }, ...vendorQuery(req) };
  const bookings = await Booking.find(query).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  res.json(bookings);
};

const getVendorReports = async (req, res) => {
  const query = vendorQuery(req);
  const [listings, movies] = await Promise.all([
    VendorListing.find(query),
    Movie.find(query),
  ]);
  const bookings = await Booking.find({ module: { $in: supportedBookingModules }, ...query });
  const movieIds = movies.map((movie) => movie._id);
  const seatBlocks = await SeatBlock.find({ targetType: "movie", targetId: { $in: movieIds }, ...query });

  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const todayRevenue = bookings
    .filter((booking) => new Date(booking.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const monthlyRevenue = bookings
    .filter((booking) => {
      const date = new Date(booking.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const bookedSeats = movies.reduce((sum, movie) => sum + Number(movie.bookedSeats?.length || 0), 0);
  const totalMovieSeats = movies.reduce((sum, movie) => sum + Number(movie.totalSeats || 0), 0);
  const blockedSeats = seatBlocks.filter((seat) => seat.status === "blocked").length;
  const removedSeats = seatBlocks.filter((seat) => seat.status === "removed").length;
  const allListings = [...movies.map((movie) => ({ module: "movie", status: movie.status || "active" })), ...listings];
  const moduleCounts = allListings.reduce((acc, listing) => {
    acc[listing.module] = (acc[listing.module] || 0) + 1;
    return acc;
  }, {});
  const platformCommission = Math.round(revenue * 0.12);

  res.json({
    totalListings: allListings.length,
    activeListings: allListings.filter((listing) => listing.status === "active").length,
    totalBookings: bookings.length,
    todayBookings: bookings.filter((booking) => new Date(booking.createdAt).toDateString() === new Date().toDateString()).length,
    totalCustomers: new Set(bookings.map((booking) => String(booking.user || booking.customerId || ""))).size,
    revenue,
    todayRevenue,
    monthlyRevenue,
    platformCommission,
    tixhubCommission: platformCommission,
    vendorEarnings: revenue - platformCommission,
    availableBalance: revenue - platformCommission,
    settledAmount: 0,
    pendingApproval: allListings.filter((listing) => listing.status === "draft").length,
    totalSeats: totalMovieSeats,
    bookedSeats,
    blockedSeats,
    availableSeats: Math.max(totalMovieSeats - bookedSeats - blockedSeats - removedSeats, 0),
    moduleCounts,
  });
};

const flightSummaryFields = [
  "airlineName",
  "airlineLogo",
  "flightNumber",
  "aircraftType",
  "cabinClass",
  "status",
  "fromCity",
  "fromAirport",
  "fromCode",
  "toCity",
  "toAirport",
  "toCode",
  "departureDate",
  "departureTime",
  "arrivalDate",
  "arrivalTime",
  "duration",
  "stops",
  "baseFare",
  "taxes",
  "platformFee",
  "ticketPrice",
  "totalSeats",
  "availableSeats",
  "bookedSeats",
  "blockedSeats",
  "baggageAllowance",
  "refundPolicy",
  "cancellationPolicy",
];

const getMovieBookingQuery = (req) => ({
  module: "movie",
  ...vendorQuery(req),
});

const findVendorMovie = async (req, movieId) => Movie.findOne({ _id: movieId, ...vendorQuery(req) });

const buildSeatsFromMovie = async (req, movie) => {
  const totalSeats = Math.max(Number(movie.totalSeats || 80), 1);
  const seatsPerRow = 8;
  const seats = [];

  for (let index = 0; index < totalSeats; index += 1) {
    const row = String.fromCharCode(65 + Math.floor(index / seatsPerRow));
    const seatNumber = `${row}${(index % seatsPerRow) + 1}`;
    seats.push({
      seatNumber,
      status: "available",
      customerName: "",
      bookingId: null,
      mobile: "",
      email: "",
      amount: movie.ticketPrice || 0,
      paymentStatus: "",
      bookingDate: "",
    });
  }

  const blocks = await SeatBlock.find({ targetType: "movie", targetId: movie._id, ...vendorQuery(req) });
  blocks.filter((block) => block.status === "custom").forEach((block) => {
    if (!seats.some((seat) => seat.seatNumber === block.seatNumber)) {
      seats.push({ seatNumber: block.seatNumber, status: "available", amount: movie.ticketPrice || 0 });
    }
  });

  const removed = new Set(blocks.filter((block) => block.status === "removed").map((block) => block.seatNumber));
  const blocked = new Set(blocks.filter((block) => block.status === "blocked").map((block) => block.seatNumber));
  const visibleSeats = seats.filter((seat) => !removed.has(seat.seatNumber));

  const bookings = await Booking.find(getMovieBookingQuery(req)).populate("user", "name email mobile phone");
  const movieBookings = bookings.filter((booking) => {
    const details = booking.details || {};
    const bookingMovieId = booking.movieId || details.movieId || details.movie?._id || details.movie?.id || details.movie;
    return String(bookingMovieId || "") === String(movie._id) || booking.title === movie.title;
  });

  const bySeat = new Map(visibleSeats.map((seat) => [seat.seatNumber, seat]));
  movieBookings.forEach((booking) => {
    (booking.seats || []).forEach((seatNumber) => {
      const seat = bySeat.get(seatNumber);
      if (!seat) return;
      const customer = booking.user || {};
      seat.status = "booked";
      seat.customerName = booking.customerName || customer.name || booking.details?.customerName || booking.details?.passenger?.name || "Customer";
      seat.bookingId = booking.bookingCode || booking._id;
      seat.customerMobile = booking.customerMobile || customer.mobile || customer.phone || booking.details?.customerMobile || booking.details?.mobile || booking.details?.passenger?.mobile || "";
      seat.mobile = seat.customerMobile;
      seat.customerEmail = booking.customerEmail || customer.email || booking.details?.customerEmail || booking.details?.email || booking.details?.passenger?.email || "";
      seat.email = seat.customerEmail;
      seat.amount = booking.amount || movie.ticketPrice || 0;
      seat.paymentStatus = booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus;
      seat.bookingStatus = booking.status;
      seat.bookingDate = booking.createdAt;
    });
  });

  visibleSeats.forEach((seat) => {
    if (seat.status === "available" && blocked.has(seat.seatNumber)) seat.status = "blocked";
  });

  return visibleSeats;
};

const getMovieSeats = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seats = await getDatabaseShowSeats({
    showId: req.query.showId || movie._id,
    movieId: movie._id,
    theatre: movie.theatre || movie.theatreName || "",
    screenId: req.query.screenId || movie.screenNumber || "Screen 1",
    showDate: req.query.showDate || movie.showDate || movie.releaseDate || "",
    showTime: req.query.showTime || movie.showTime || movie.showTimes?.[0] || "",
    totalSeats: req.query.totalSeats || movie.totalSeats,
    price: req.query.price || movie.ticketPrice,
    regularSeatPrice: movie.regularSeatPrice,
    premiumSeatPrice: movie.premiumSeatPrice,
    vipSeatPrice: movie.vipSeatPrice,
  });
  res.json({ movie, seats });
};

const blockMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seat = await setMovieSeatBlocked({
    showId: req.body.showId || req.query.showId || movie._id,
    movieId: movie._id,
    screenId: req.body.screenId || req.query.screenId || movie.screenNumber || "Screen 1",
    totalSeats: req.body.totalSeats || req.query.totalSeats || movie.totalSeats,
    price: req.body.price || req.query.price || movie.ticketPrice,
  }, req.params.seatNumber, req.user, req.body.blockedReason);
  await createNotification({
    vendorId: req.user.id,
    userId: req.user.id,
    type: "seat_blocked",
    title: "Seat blocked",
    message: `${seat.seatNo || req.params.seatNumber} blocked for ${movie.title}.`,
    movieId: movie._id,
  });
  res.json({ message: "Seat blocked", seat });
};

const unblockMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seat = await setMovieSeatAvailable({
    showId: req.body.showId || req.query.showId || movie._id,
    movieId: movie._id,
    screenId: req.body.screenId || req.query.screenId || movie.screenNumber || "Screen 1",
    totalSeats: req.body.totalSeats || req.query.totalSeats || movie.totalSeats,
    price: req.body.price || req.query.price || movie.ticketPrice,
  }, req.params.seatNumber);
  res.json({ message: "Seat unblocked", seat });
};

const removeMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seats = await buildSeatsFromMovie(req, movie);
  const seat = seats.find((item) => item.seatNumber === req.params.seatNumber);
  if (seat?.status === "booked") return res.status(400).json({ message: "Booked seat cannot be removed directly" });
  await SeatBlock.findOneAndUpdate(
    { vendorId: req.user.id, targetType: "movie", targetId: movie._id, seatNumber: req.params.seatNumber },
    { ...vendorPayload(req), targetType: "movie", targetId: movie._id, seatNumber: req.params.seatNumber, status: "removed" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ message: "Seat removed" });
};

const addMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seatNumber = req.body.seatNumber;
  if (!seatNumber) return res.status(400).json({ message: "Seat number is required" });
  await SeatBlock.findOneAndUpdate(
    { vendorId: req.user.id, targetType: "movie", targetId: movie._id, seatNumber },
    { ...vendorPayload(req), targetType: "movie", targetId: movie._id, seatNumber, status: "custom" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json({ message: "Seat added" });
};

const getVendorCustomers = async (req, res) => {
  const bookings = await Booking.find({ module: { $in: supportedBookingModules }, ...vendorQuery(req) }).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  const customers = new Map();
  bookings.forEach((booking) => {
    const user = booking.user || {};
    const id = String(user._id || booking.customerEmail || booking.details?.email || booking._id);
    const current = customers.get(id) || {
      _id: id,
      customerName: user.name || booking.customerName || booking.details?.customerName || booking.details?.passenger?.name || "Customer",
      email: user.email || booking.customerEmail || booking.details?.email || booking.details?.passenger?.email || "",
      mobile: user.mobile || user.phone || booking.customerMobile || booking.details?.mobile || booking.details?.passenger?.mobile || "",
      totalBookings: 0,
      totalSpend: 0,
      lastBooking: booking.createdAt,
    };
    current.totalBookings += 1;
    current.totalSpend += Number(booking.amount || 0);
    if (new Date(booking.createdAt) > new Date(current.lastBooking)) current.lastBooking = booking.createdAt;
    customers.set(id, current);
  });
  res.json([...customers.values()]);
};

const getVendorAvailability = async (req, res) => {
  const movies = await Movie.find(vendorQuery(req)).sort({ createdAt: -1 });
  const rows = await Promise.all(movies.map(async (movie) => {
    const seats = await buildSeatsFromMovie(req, movie);
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((seat) => seat.status === "booked").length;
    const blockedSeats = seats.filter((seat) => seat.status === "blocked").length;
    const availableSeats = seats.filter((seat) => seat.status === "available").length;
    return {
      _id: movie._id,
      movie: movie.title,
      theatre: movie.theatre || movie.theatreName || "-",
      showTime: movie.showTime || movie.showTimes?.[0] || "-",
      showDate: movie.showDate || movie.releaseDate || "-",
      totalSeats,
      bookedSeats,
      availableSeats,
      blockedSeats,
      occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
    };
  }));
  res.json(rows);
};

const getPaymentDetails = async (req, res) => {
  const detail = await PaymentDetail.findOne(vendorQuery(req));
  res.json(detail || {});
};

const savePaymentDetails = async (req, res) => {
  if (req.body.accountNumber && req.body.confirmAccountNumber && req.body.accountNumber !== req.body.confirmAccountNumber) {
    return res.status(400).json({ message: "Account number and confirmation must match" });
  }

  const detail = await PaymentDetail.findOneAndUpdate(
    { vendor: req.user.id },
    { ...req.body, ...vendorPayload(req) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ message: "Payment details saved", detail });
};

const createTheatre = async (req, res) => {
  const theatre = await Theatre.create({ ...req.body, ...vendorPayload(req) });
  res.status(201).json({ message: "Theatre created", theatre });
};

const getTheatres = async (req, res) => {
  const theatres = await Theatre.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(theatres);
};

const updateTheatre = async (req, res) => {
  const theatre = await Theatre.findOneAndUpdate({ _id: req.params.id, ...vendorQuery(req) }, req.body, { new: true });
  if (!theatre) return res.status(404).json({ message: "Theatre not found" });
  res.json({ message: "Theatre updated", theatre });
};

const deleteTheatre = async (req, res) => {
  const theatre = await Theatre.findOneAndDelete({ _id: req.params.id, ...vendorQuery(req) });
  if (!theatre) return res.status(404).json({ message: "Theatre not found" });
  res.json({ success: true });
};

const createScreen = async (req, res) => {
  const theatre = await Theatre.findOne({ _id: req.body.theatreId, ...vendorQuery(req) });
  if (!theatre) return res.status(404).json({ message: "Theatre not found" });
  const rows = numberValue(req.body.rows || req.body.totalRows || 10);
  const seatsPerRow = numberValue(req.body.seatsPerRow || 10);
  const categories = buildScreenCategories({
    ...req.body,
    totalSeats: req.body.totalSeats || rows * seatsPerRow,
  });
  const screen = await Screen.create({
    ...req.body,
    rows,
    seatsPerRow,
    totalSeats: categories.totalSeats,
    ...categories,
    ...vendorPayload(req),
  });
  res.status(201).json({ message: "Screen created", screen });
};

const getScreens = async (req, res) => {
  const query = vendorQuery(req);
  if (req.query.theatreId) query.theatreId = req.query.theatreId;
  const screens = await Screen.find(query).populate("theatreId", "name city").sort({ createdAt: -1 });
  res.json(screens);
};

const createShow = async (req, res) => {
  const [screen, movie] = await Promise.all([
    Screen.findOne({ _id: req.body.screenId, ...vendorQuery(req) }),
    Movie.findOne({ _id: req.body.movieId, ...vendorQuery(req) }),
  ]);
  if (!screen) return res.status(404).json({ message: "Screen not found" });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const show = await Show.create({ ...req.body, theatreId: req.body.theatreId || screen.theatreId, ...vendorPayload(req) });
  await ensureShowSeats({
    showId: show._id,
    movieId: movie._id,
    theatreId: show.theatreId,
    screenId: screen._id,
    showDate: show.showDate,
    showTime: show.showTime,
    totalSeats: screen.totalSeats || Number(screen.rows || 10) * Number(screen.seatsPerRow || 12),
    rows: screen.rows,
    seatsPerRow: screen.seatsPerRow,
    vipSeats: screen.vipSeats,
    primeSeats: screen.primeSeats,
    regularSeats: screen.regularSeats,
    vipPrice: screen.vipPrice || movie.vipSeatPrice,
    primePrice: screen.primePrice || movie.premiumSeatPrice,
    regularPrice: screen.regularPrice || movie.regularSeatPrice,
    price: show.price || movie.ticketPrice,
    regularSeatPrice: movie.regularSeatPrice,
    premiumSeatPrice: movie.premiumSeatPrice,
    vipSeatPrice: movie.vipSeatPrice,
  });
  res.status(201).json({ message: "Show created", show });
};

const getShows = async (req, res) => {
  const [shows, screens, movies, theatres] = await Promise.all([
    Show.find(vendorQuery(req)).sort({ showDate: -1, showTime: -1 }),
    Screen.find(vendorQuery(req)),
    Movie.find(vendorQuery(req)),
    Theatre.find(vendorQuery(req)),
  ]);
  const screenMap = new Map(screens.map((screen) => [String(screen._id), screen]));
  const movieMap = new Map(movies.map((movie) => [String(movie._id), movie]));
  const theatreMap = new Map(theatres.map((theatre) => [String(theatre._id), theatre]));
  res.json(shows.map((show) => ({
    ...show.toObject?.() || show,
    screenId: screenMap.get(String(show.screenId)) || show.screenId,
    movieId: movieMap.get(String(show.movieId)) || show.movieId,
    theatreId: theatreMap.get(String(show.theatreId)) || show.theatreId,
  })));
};

const seatTypeFor = (seatNumber) => {
  const column = String(seatNumber || "").replace(/\d/g, "").charAt(0);
  if (["A", "K"].includes(column)) return "window";
  if (["C", "D", "G", "H"].includes(column)) return "aisle";
  return "middle";
};

const buildMovieSeats = (screen, price) => {
  const rows = Math.max(Number(screen?.rows || 10), 1);
  const seatsPerRow = Math.max(Number(screen?.seatsPerRow || 12), 1);
  const seats = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = String.fromCharCode(65 + rowIndex);
    for (let seatIndex = 1; seatIndex <= seatsPerRow; seatIndex += 1) {
      const seatNumber = `${row}${seatIndex}`;
      seats.push({ seatNumber, status: "available", bookingId: null, customerId: null, customerName: "", passengerName: "", price, seatType: seatTypeFor(seatNumber) });
    }
  }
  return seats;
};

const aircraftLayouts = {
  A320: { rows: 20, groups: [["A", "B", "C"], ["D", "E", "F"]] },
  B737: { rows: 20, groups: [["A", "B", "C"], ["D", "E", "F"]] },
  ATR72: { rows: 18, groups: [["A", "B"], ["C", "D"]] },
  B777: { rows: 35, groups: [["A", "B", "C"], ["D", "E", "F", "G"], ["H", "J", "K"]] },
};

const buildFlightSeats = (aircraftType, price) => {
  const layout = aircraftLayouts[aircraftType] || aircraftLayouts.A320;
  const letters = layout.groups.flat();
  const seats = [];
  for (let row = 1; row <= layout.rows; row += 1) {
    letters.forEach((letter) => {
      const seatNumber = `${letter}${row}`;
      seats.push({ seatNumber, status: "available", bookingId: null, customerId: null, customerName: "", passengerName: "", price, amount: price, seatType: seatTypeFor(seatNumber), groupCount: layout.groups.length });
    });
  }
  return seats;
};

const hydrateSeatBookings = (seats, bookings) => {
  const bySeat = new Map(seats.map((seat) => [seat.seatNumber, seat]));
  bookings.forEach((booking) => {
    (booking.seats || []).forEach((seatNumber) => {
      const seat = bySeat.get(seatNumber);
      if (!seat) return;
      const customer = booking.user || {};
      seat.status = "booked";
      seat.bookingId = booking.bookingCode || booking._id;
      seat.customerId = customer._id || booking.user;
      seat.customerName = booking.customerName || customer.name || booking.details?.customerName || booking.details?.passenger?.name || booking.details?.user?.name || "Customer";
      seat.passengerName = booking.details?.passenger?.name || seat.customerName;
      seat.customerMobile = booking.customerMobile || customer.mobile || customer.phone || booking.details?.customerMobile || booking.details?.passenger?.mobile || "";
      seat.mobile = seat.customerMobile;
      seat.customerEmail = booking.customerEmail || customer.email || booking.details?.customerEmail || booking.details?.passenger?.email || "";
      seat.email = seat.customerEmail;
      seat.amount = booking.amount;
      seat.paymentStatus = booking.paymentStatus === "paid" ? "Paid" : booking.paymentStatus;
      seat.bookingStatus = booking.status;
      seat.bookingDate = booking.createdAt;
    });
  });
};

const applySeatBlocks = async (req, targetType, targetId, seats) => {
  const blocks = await SeatBlock.find({ targetType, targetId, ...vendorQuery(req) });
  const blocked = new Set(blocks.map((block) => block.seatNumber));
  seats.forEach((seat) => {
    if (seat.status === "available" && blocked.has(seat.seatNumber)) seat.status = "blocked";
  });
};

const getShowSeats = async (req, res) => {
  const show = await Show.findOne({ _id: req.params.showId, ...vendorQuery(req) });
  if (!show) {
    const movie = await Movie.findOne({ _id: req.params.showId, ...vendorQuery(req) });
    if (!movie) return res.status(404).json({ message: "Show not found" });
    const seats = await getDatabaseShowSeats({
      showId: movie._id,
      movieId: movie._id,
      screenId: movie.screenNumber || "Screen 1",
      totalSeats: movie.totalSeats,
      price: movie.ticketPrice,
    });
    return res.json({ show: null, movie, seats });
  }
  const screen = await Screen.findOne({ _id: show.screenId, ...vendorQuery(req) });
  const movie = await Movie.findOne({ _id: show.movieId, ...vendorQuery(req) });
  const seats = await getDatabaseShowSeats({
    showId: show._id,
    movieId: show.movieId,
    theatreId: show.theatreId,
    screenId: show.screenId,
    showDate: show.showDate,
    showTime: show.showTime,
    totalSeats: screen?.totalSeats || Number(screen?.rows || 10) * Number(screen?.seatsPerRow || 12),
    rows: screen?.rows,
    seatsPerRow: screen?.seatsPerRow,
    vipSeats: screen?.vipSeats,
    primeSeats: screen?.primeSeats,
    regularSeats: screen?.regularSeats,
    vipPrice: screen?.vipPrice || movie?.vipSeatPrice,
    primePrice: screen?.primePrice || movie?.premiumSeatPrice,
    regularPrice: screen?.regularPrice || movie?.regularSeatPrice,
    price: show.price || movie?.ticketPrice,
    regularSeatPrice: movie?.regularSeatPrice,
    premiumSeatPrice: movie?.premiumSeatPrice,
    vipSeatPrice: movie?.vipSeatPrice,
  });
  res.json({ show, seats });
};

const getFlightSeats = async (req, res) => {
  const flight = await VendorListing.findOne({ _id: req.params.flightId, module: "flight", ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  const seats = buildFlightSeats(flight.details?.aircraftType || "A320", flight.price || flight.details?.price || flight.details?.ticketPrice || 0);
  const bookings = await Booking.find({
    module: "flight",
    $and: [
      vendorQuery(req),
      {
        $or: [
          { "details.flightId": req.params.flightId },
          { "details.flight._id": req.params.flightId },
        ],
      },
    ],
  }).populate("user", "name email mobile phone");
  hydrateSeatBookings(seats, bookings);
  await applySeatBlocks(req, "flight", flight._id, seats);
  res.json({ flight, seats });
};

const flightPayloadFromRequest = (body) => {
  const source = body.details && typeof body.details === "object" ? body.details : body;
  const payload = {};
  flightSummaryFields.forEach((field) => {
    if (source[field] !== undefined) payload[field] = source[field];
  });

  payload.airlineLogo = payload.airlineLogo || source.airlineLogoUrl || source.imageUrl || "";
  payload.fromCode = payload.fromCode || source.fromAirportCode || "";
  payload.toCode = payload.toCode || source.toAirportCode || "";
  payload.ticketPrice = numberValue(payload.ticketPrice || source.price);
  payload.baseFare = numberValue(payload.baseFare);
  payload.taxes = numberValue(payload.taxes);
  payload.platformFee = numberValue(payload.platformFee);
  payload.totalSeats = numberValue(payload.totalSeats);
  payload.availableSeats = numberValue(payload.availableSeats);
  payload.bookedSeats = numberValue(payload.bookedSeats);
  payload.blockedSeats = numberValue(payload.blockedSeats);
  payload.status = String(payload.status || "active").toLowerCase();

  if (!payload.totalSeats) {
    payload.totalSeats = buildFlightSeats(payload.aircraftType || "A320", payload.ticketPrice).length;
  }

  return payload;
};

const normalizeFlightCounts = (flight) => {
  const seats = flight.seats || [];
  flight.totalSeats = seats.length || flight.totalSeats || 0;
  flight.bookedSeats = seats.filter((seat) => seat.status === "booked").length;
  flight.blockedSeats = seats.filter((seat) => seat.status === "blocked").length;
  flight.availableSeats = Math.max(flight.totalSeats - flight.bookedSeats - flight.blockedSeats, 0);
  return flight;
};

const mergeFlightBookingsIntoSeats = async (req, flight) => {
  const seats = flight.seats?.length
    ? flight.seats.map((seat) => ({ ...seat.toObject?.() || seat }))
    : buildFlightSeats(flight.aircraftType || "A320", flight.ticketPrice || 0);

  const bookings = await Booking.find({
    module: "flight",
    $and: [
      vendorQuery(req),
      {
        $or: [
          { "details.flightId": flight._id },
          { "details.flight._id": flight._id },
          { "details.flight.id": flight._id.toString() },
        ],
      },
    ],
  }).populate("user", "name email mobile phone");

  hydrateSeatBookings(seats, bookings);
  const blocks = await SeatBlock.find({ targetType: "flight", targetId: flight._id, ...vendorQuery(req) });
  const blocked = new Set(blocks.map((block) => block.seatNumber));
  seats.forEach((seat) => {
    if (seat.status === "available" && blocked.has(seat.seatNumber)) seat.status = "blocked";
  });

  return seats;
};

const prepareFlightPayload = (req) => {
  const payload = flightPayloadFromRequest(req.body);
  const seats = buildFlightSeats(payload.aircraftType || "A320", payload.ticketPrice || 0)
    .slice(0, payload.totalSeats || undefined)
    .map((seat) => ({
      seatNumber: seat.seatNumber,
      status: "available",
      bookingId: null,
      passengerName: "",
      pnr: "",
      mobile: "",
      email: "",
      amount: payload.ticketPrice || 0,
      paymentStatus: "",
      bookingStatus: "",
      seatType: seat.seatType,
    }));

  payload.seats = seats;
  payload.totalSeats = seats.length;
  payload.availableSeats = seats.length;
  payload.bookedSeats = 0;
  payload.blockedSeats = 0;
  return payload;
};

const getVendorFlights = async (req, res) => {
  const flights = await Flight.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(flights);
};

const getVendorFlight = async (req, res) => {
  const flight = await Flight.findOne({ _id: req.params.id, ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  res.json(flight);
};

const createVendorFlight = async (req, res) => {
  const payload = prepareFlightPayload(req);
  if (!payload.airlineName || !payload.flightNumber) {
    return res.status(400).json({ message: "Airline name and flight number are required" });
  }
  const flight = await Flight.create({ ...payload, ...vendorPayload(req) });
  res.status(201).json({ message: "Flight created", flight });
};

const updateVendorFlight = async (req, res) => {
  const existing = await Flight.findOne({ _id: req.params.id, ...vendorQuery(req) });
  if (!existing) return res.status(404).json({ message: "Flight not found" });

  const payload = prepareFlightPayload(req);
  const bookedSeats = new Map((existing.seats || []).filter((seat) => seat.status === "booked").map((seat) => [seat.seatNumber, seat]));
  payload.seats = payload.seats.map((seat) => bookedSeats.get(seat.seatNumber) || seat);
  normalizeFlightCounts(payload);

  Object.assign(existing, payload);
  await existing.save();
  res.json({ message: "Flight updated", flight: existing });
};

const deleteVendorFlight = async (req, res) => {
  const flight = await Flight.findOneAndDelete({ _id: req.params.id, ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  await SeatBlock.deleteMany({ targetType: "flight", targetId: flight._id, ...vendorQuery(req) });
  res.json({ success: true });
};

const getVendorFlightSeats = async (req, res) => {
  const flight = await Flight.findOne({ _id: req.params.flightId, ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  const seats = await mergeFlightBookingsIntoSeats(req, flight);
  res.json({ flight, seats });
};

const updateFlightSeatBlock = async (req, res, status) => {
  const flight = await Flight.findOne({ _id: req.params.flightId, ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });

  const seat = (flight.seats || []).find((item) => item.seatNumber === req.params.seatNumber);
  if (!seat) return res.status(404).json({ message: "Seat not found" });
  if (seat.status === "booked") return res.status(400).json({ message: "Booked seat cannot be blocked or unblocked" });

  seat.status = status;
  normalizeFlightCounts(flight);
  await flight.save();

  if (status === "blocked") {
    await SeatBlock.findOneAndUpdate(
      { vendorId: req.user.id, targetType: "flight", targetId: flight._id, seatNumber: seat.seatNumber },
      { ...vendorPayload(req), targetType: "flight", targetId: flight._id, seatNumber: seat.seatNumber, status: "blocked" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    await SeatBlock.findOneAndDelete({ targetType: "flight", targetId: flight._id, seatNumber: seat.seatNumber, ...vendorQuery(req) });
  }

  res.json({ message: status === "blocked" ? "Seat blocked" : "Seat unblocked", seat });
};

const blockVendorFlightSeat = (req, res) => updateFlightSeatBlock(req, res, "blocked");
const unblockVendorFlightSeat = (req, res) => updateFlightSeatBlock(req, res, "available");

const getVendorFlightSeatDetails = async (req, res) => {
  const flight = await Flight.findOne({ _id: req.params.flightId, ...vendorQuery(req) });
  if (!flight) return res.status(404).json({ message: "Flight not found" });
  const seats = await mergeFlightBookingsIntoSeats(req, flight);
  const seat = seats.find((item) => item.seatNumber === req.params.seatNumber);
  if (!seat) return res.status(404).json({ message: "Seat not found" });
  res.json({ flight, seat });
};

const getFlightBookingRows = async (req) => {
  const bookings = await Booking.find({ module: "flight", ...vendorQuery(req) }).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  return bookings.map((booking) => {
    const details = booking.details || {};
    const passenger = details.passenger || {};
    const flight = details.flight || {};
    return {
      _id: booking._id,
      bookingId: booking.bookingCode || booking._id,
      pnr: details.pnr || booking.bookingCode || "",
      passengerName: passenger.name || booking.customerName || booking.user?.name || "Passenger",
      age: passenger.age || "",
      gender: passenger.gender || "",
      mobile: passenger.mobile || booking.customerMobile || booking.user?.mobile || booking.user?.phone || "",
      email: passenger.email || booking.customerEmail || booking.user?.email || "",
      flightNumber: flight.flightNumber || "",
      route: [flight.fromCode || flight.from, flight.toCode || flight.to].filter(Boolean).join(" to "),
      departureDate: flight.departureDate || "",
      departureTime: flight.departureTime || "",
      seatNumber: (booking.seats || details.seats || []).join(", "),
      amount: booking.amount || 0,
      paymentStatus: booking.paymentStatus || "",
      bookingStatus: booking.status || "",
      bookingDate: booking.createdAt,
      idProofType: passenger.idProofType || "",
      idProofNumber: passenger.idProofNumber || "",
    };
  });
};

const getVendorFlightBookings = async (req, res) => {
  res.json(await getFlightBookingRows(req));
};

const getVendorPassengers = async (req, res) => {
  const bookings = await getFlightBookingRows(req);
  res.json(bookings.map((booking) => ({
    passengerName: booking.passengerName,
    age: booking.age,
    gender: booking.gender,
    mobile: booking.mobile,
    email: booking.email,
    flightNumber: booking.flightNumber,
    seatNumber: booking.seatNumber,
    pnr: booking.pnr,
    idProofType: booking.idProofType,
    idProofNumber: booking.idProofNumber,
  })));
};

const getVendorFlightRevenue = async (req, res) => {
  const bookings = await Booking.find({ module: "flight", ...vendorQuery(req) });
  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const today = new Date().toDateString();
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const todayRevenue = bookings
    .filter((booking) => new Date(booking.createdAt).toDateString() === today)
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const monthlyRevenue = bookings
    .filter((booking) => {
      const date = new Date(booking.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const tixhubCommission = Math.round(revenue * 0.12);
  res.json({
    totalRevenue: revenue,
    todayRevenue,
    monthlyRevenue,
    tixhubCommission,
    vendorEarnings: revenue - tixhubCommission,
    settledAmount: 0,
  });
};

const getVendorFlightDashboardStats = async (req, res) => {
  const [flights, bookings, revenue] = await Promise.all([
    Flight.find(vendorQuery(req)),
    getFlightBookingRows(req),
    getVendorFlightRevenueData(req),
  ]);
  const totalSeats = flights.reduce((sum, flight) => sum + Number(flight.totalSeats || 0), 0);
  const bookedSeats = flights.reduce((sum, flight) => sum + Number(flight.bookedSeats || 0), 0);
  const blockedSeats = flights.reduce((sum, flight) => sum + Number(flight.blockedSeats || 0), 0);
  const today = new Date().toDateString();
  res.json({
    totalFlights: flights.length,
    activeFlights: flights.filter((flight) => flight.status === "active").length,
    todayBookings: bookings.filter((booking) => new Date(booking.bookingDate).toDateString() === today).length,
    totalPassengers: bookings.length,
    totalRevenue: revenue.totalRevenue,
    availableSeats: Math.max(totalSeats - bookedSeats - blockedSeats, 0),
    bookedSeats,
    blockedSeats,
    occupancyRate: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
    topRoutes: Object.entries(flights.reduce((acc, flight) => {
      const route = `${flight.fromCode || flight.fromCity} to ${flight.toCode || flight.toCity}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {})).map(([route, count]) => ({ route, count })).slice(0, 5),
    recentBookings: bookings.slice(0, 6),
    seatSummary: { totalSeats, bookedSeats, blockedSeats, availableSeats: Math.max(totalSeats - bookedSeats - blockedSeats, 0) },
  });
};

const getVendorFlightRevenueData = async (req) => {
  const bookings = await Booking.find({ module: "flight", ...vendorQuery(req) });
  const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  return { totalRevenue };
};

const setSeatBlock = async (req, res, targetType) => {
  const targetId = req.params.showId || req.params.flightId;
  await SeatBlock.findOneAndUpdate(
    { vendorId: req.user.id, targetType, targetId, seatNumber: req.params.seatNumber },
    { ...vendorPayload(req), targetType, targetId, seatNumber: req.params.seatNumber },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ message: "Seat blocked" });
};

const unsetSeatBlock = async (req, res, targetType) => {
  const targetId = req.params.showId || req.params.flightId;
  await SeatBlock.findOneAndDelete({ targetType, targetId, seatNumber: req.params.seatNumber, ...vendorQuery(req) });
  res.json({ message: "Seat unblocked" });
};

const getSettlements = async (req, res) => {
  const reportReq = { ...req, user: req.user };
  const bookings = await Booking.find({ module: { $in: supportedBookingModules }, ...vendorQuery(reportReq) });
  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const commission = Math.round(revenue * 0.12);
  res.json([
    {
      _id: "current-cycle",
      cycle: "Current cycle",
      amount: revenue - commission,
      date: new Date(),
      grossRevenue: revenue,
      commission,
      netPayable: revenue - commission,
      status: revenue ? "pending" : "no dues",
      transactionId: revenue ? "Pending" : "-",
    },
  ]);
};

module.exports = {
  createVendorListing,
  createVendorFlight,
  createVendorMovie,
  deleteVendorFlight,
  deleteVendorListing,
  deleteVendorMovie,
  blockVendorFlightSeat,
  getVendorBookings,
  getVendorFlight,
  getVendorFlightBookings,
  getVendorFlightDashboardStats,
  getVendorFlightRevenue,
  getVendorFlights,
  getVendorFlightSeatDetails,
  getVendorFlightSeats,
  getVendorListings,
  getVendorMovieDashboard,
  getVendorMovieDetails,
  getVendorMovies,
  getVendorPassengers,
  getVendorReports,
  addMovieSeat,
  blockMovieSeat,
  createScreen,
  createShow,
  createTheatre,
  deleteTheatre,
  getMovieSeats,
  getFlightSeats,
  getVendorAvailability,
  getVendorCustomers,
  getPaymentDetails,
  getScreens,
  getSettlements,
  getShows,
  getShowSeats,
  getTheatres,
  savePaymentDetails,
  removeMovieSeat,
  setSeatBlock,
  unsetSeatBlock,
  unblockMovieSeat,
  unblockVendorFlightSeat,
  updateTheatre,
  updateVendorFlight,
  updateVendorListing,
  updateVendorMovie,
};
