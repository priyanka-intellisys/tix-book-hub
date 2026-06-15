const VendorListing = require("../models/VendorListing");
const Booking = require("../models/Booking");

const moduleTitles = {
  flight: "airlineName",
  hotel: "hotelName",
  event: "eventTitle",
  bus: "operatorName",
  "travel-package": "packageTitle",
};

const modulePriceFields = {
  flight: "price",
  hotel: "pricePerNight",
  event: "ticketPrice",
  bus: "price",
  "travel-package": "pricePerPerson",
};

const moduleInventoryFields = {
  flight: "availableSeats",
  hotel: "availableRooms",
  event: "totalTickets",
  bus: "seatCount",
  "travel-package": "totalSeats",
};

const supportedBookingModules = ["flight", "hotel", "event", "bus", "travel-package"];

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const makeSummary = (module, details) => {
  const rawTitle = String(details[moduleTitles[module]] || "").trim();
  const title = rawTitle || "Untitled listing";
  const price = numberValue(details[modulePriceFields[module]]);
  const inventory = numberValue(details[moduleInventoryFields[module]]);
  const imageUrl = String(details.imageUrl || details.bannerImageUrl || "").trim();

  const route = module === "flight"
    ? [details.fromAirport, details.toAirport].filter(Boolean).join(" to ")
    : module === "bus"
      ? [details.fromCity, details.toCity].filter(Boolean).join(" to ")
      : module === "travel-package"
        ? String(details.destination || "").trim()
        : String(details.city || "").trim();

  return {
    title,
    price,
    inventory,
    imageUrl,
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

const getVendorListings = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { vendor: req.user.id };
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
    vendor: req.user.id,
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

  const ownerQuery = req.user.role === "admin" ? {} : { vendor: req.user.id };
  const listing = await VendorListing.findOneAndUpdate(
    { _id: req.params.id, ...ownerQuery },
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
  const ownerQuery = req.user.role === "admin" ? {} : { vendor: req.user.id };
  const listing = await VendorListing.findOneAndDelete({ _id: req.params.id, ...ownerQuery });

  if (!listing) return res.status(404).json({ message: "Listing not found" });
  res.json({ success: true });
};

const getVendorBookings = async (req, res) => {
  const bookings = await Booking.find({ module: { $in: supportedBookingModules } }).sort({ createdAt: -1 });
  res.json(bookings);
};

const getVendorReports = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { vendor: req.user.id };
  const listings = await VendorListing.find(query);
  const bookings = await Booking.find({ module: { $in: supportedBookingModules } });

  const revenue = bookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  const moduleCounts = listings.reduce((acc, listing) => {
    acc[listing.module] = (acc[listing.module] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalListings: listings.length,
    activeListings: listings.filter((listing) => listing.status === "active").length,
    totalBookings: bookings.length,
    revenue,
    moduleCounts,
  });
};

module.exports = {
  createVendorListing,
  deleteVendorListing,
  getVendorBookings,
  getVendorListings,
  getVendorReports,
  updateVendorListing,
};
