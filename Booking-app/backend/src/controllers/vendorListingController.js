const VendorListing = require("../models/VendorListing");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Movie = require("../models/Movie");
const PaymentDetail = require("../models/PaymentDetail");
const Theatre = require("../models/Theatre");
const Screen = require("../models/Screen");
const Show = require("../models/Show");
const SeatBlock = require("../models/SeatBlock");

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

const vendorPayload = (req) => ({
  vendor: req.user.id,
  vendorId: req.user.id,
});

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

const getVendorMovies = async (req, res) => {
  const movies = await Movie.find(vendorQuery(req)).sort({ createdAt: -1 });
  res.json(movies);
};

const createVendorMovie = async (req, res) => {
  const movie = await Movie.create({ ...req.body, ...vendorPayload(req) });
  res.status(201).json({ message: "Movie created", movie });
};

const updateVendorMovie = async (req, res) => {
  const movie = await Movie.findOneAndUpdate({ _id: req.params.id, ...vendorQuery(req) }, req.body, { new: true });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  res.json({ message: "Movie updated", movie });
};

const deleteVendorMovie = async (req, res) => {
  const movie = await Movie.findOneAndDelete({ _id: req.params.id, ...vendorQuery(req) });
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  res.json({ success: true });
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
    pendingSettlements: revenue - platformCommission,
    pendingSettlement: revenue - platformCommission,
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
  const seats = await buildSeatsFromMovie(req, movie);
  res.json({ movie, seats });
};

const blockMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  const seats = await buildSeatsFromMovie(req, movie);
  const seat = seats.find((item) => item.seatNumber === req.params.seatNumber);
  if (seat?.status === "booked") return res.status(400).json({ message: "Booked seat cannot be blocked" });
  await SeatBlock.findOneAndUpdate(
    { vendorId: req.user.id, targetType: "movie", targetId: movie._id, seatNumber: req.params.seatNumber },
    { ...vendorPayload(req), targetType: "movie", targetId: movie._id, seatNumber: req.params.seatNumber, status: "blocked" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ message: "Seat blocked" });
};

const unblockMovieSeat = async (req, res) => {
  const movie = await findVendorMovie(req, req.params.movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });
  await SeatBlock.findOneAndDelete({ targetType: "movie", targetId: movie._id, seatNumber: req.params.seatNumber, ...vendorQuery(req), status: "blocked" });
  res.json({ message: "Seat unblocked" });
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
  const bookings = await Booking.find(getMovieBookingQuery(req)).populate("user", "name email mobile phone").sort({ createdAt: -1 });
  const customers = new Map();
  bookings.forEach((booking) => {
    const user = booking.user || {};
    const id = String(user._id || booking.details?.email || booking._id);
    const current = customers.get(id) || {
      _id: id,
      customerName: user.name || booking.details?.customerName || booking.details?.passenger?.name || "Customer",
      email: user.email || booking.details?.email || booking.details?.passenger?.email || "",
      mobile: user.mobile || user.phone || booking.details?.mobile || booking.details?.passenger?.mobile || "",
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
  const screen = await Screen.create({ ...req.body, ...vendorPayload(req) });
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
  res.status(201).json({ message: "Show created", show });
};

const getShows = async (req, res) => {
  const shows = await Show.find(vendorQuery(req))
    .populate("theatreId", "name city")
    .populate("screenId", "name rows seatsPerRow screenType")
    .populate("movieId", "title image")
    .sort({ showDate: -1, showTime: -1 });
  res.json(shows);
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
      const seatNumber = `${row}${letter}`;
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
  const show = await Show.findOne({ _id: req.params.showId, ...vendorQuery(req) }).populate("screenId");
  if (!show) {
    const movie = await Movie.findOne({ _id: req.params.showId, ...vendorQuery(req) });
    if (!movie) return res.status(404).json({ message: "Show not found" });
    const seats = await buildSeatsFromMovie(req, movie);
    return res.json({ show: null, movie, seats });
  }
  const seats = buildMovieSeats(show.screenId, show.price);
  const bookings = await Booking.find({
    module: "movie",
    $and: [
      vendorQuery(req),
      {
        $or: [
          { showId: req.params.showId },
          { "details.showId": req.params.showId },
          { "details.show._id": req.params.showId },
          { movieId: show.movieId },
          { "details.movieId": show.movieId },
        ],
      },
    ],
  }).populate("user", "name email mobile phone");
  hydrateSeatBookings(seats, bookings);
  await applySeatBlocks(req, "show", show._id, seats);
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
    pendingSettlement: revenue - tixhubCommission,
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
      grossRevenue: revenue,
      commission,
      netPayable: revenue - commission,
      status: revenue ? "pending" : "no dues",
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
