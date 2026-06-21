const express = require("express");
const mongoose = require("mongoose");

const VendorListing = require("../models/VendorListing");
const Flight = require("../models/Flight");

const router = express.Router();

const flights = [
  {
    id: "fl-6e-214",
    airline: "IndiGo",
    flightNumber: "6E-214",
    from: "Pune",
    fromCode: "PNQ",
    fromAirport: "Pune International Airport",
    to: "Delhi",
    toCode: "DEL",
    toAirport: "Indira Gandhi International Airport",
    departureDate: "2026-06-20",
    departureTime: "08:20",
    arrivalTime: "10:35",
    duration: "2h 15m",
    stops: "Non-stop",
    price: 4240,
    rating: "4.6",
    baggage: "15kg check-in + 7kg cabin",
    refundable: "Partially refundable",
    aircraft: "Airbus A320",
    cabinClasses: ["Economy", "Premium Economy"],
    reservedSeats: ["1A", "1B", "3C", "5D", "8E", "12F"],
  },
  {
    id: "fl-ai-852",
    airline: "Air India",
    flightNumber: "AI-852",
    from: "Mumbai",
    fromCode: "BOM",
    fromAirport: "Chhatrapati Shivaji Maharaj International Airport",
    to: "Bengaluru",
    toCode: "BLR",
    toAirport: "Kempegowda International Airport",
    departureDate: "2026-06-24",
    departureTime: "13:10",
    arrivalTime: "15:00",
    duration: "1h 50m",
    stops: "Non-stop",
    price: 3890,
    rating: "4.4",
    baggage: "15kg check-in + 7kg cabin",
    refundable: "Refundable with airline fee",
    aircraft: "Airbus A321",
    cabinClasses: ["Economy", "Business Class"],
    reservedSeats: ["2A", "4F", "7C", "9D", "11B"],
  },
  {
    id: "fl-uk-992",
    airline: "Vistara",
    flightNumber: "UK-992",
    from: "Delhi",
    fromCode: "DEL",
    fromAirport: "Indira Gandhi International Airport",
    to: "Mumbai",
    toCode: "BOM",
    toAirport: "Chhatrapati Shivaji Maharaj International Airport",
    departureDate: "2026-06-21",
    departureTime: "18:45",
    arrivalTime: "21:05",
    duration: "2h 20m",
    stops: "Non-stop",
    price: 5120,
    rating: "4.8",
    baggage: "15kg check-in + 7kg cabin",
    refundable: "Partially refundable",
    aircraft: "Boeing 737",
    cabinClasses: ["Economy", "Premium Economy", "Business Class"],
    reservedSeats: ["1D", "2E", "6A", "10C", "14F"],
  },
];

const recentSearches = [
  { id: "rs-1", from: "Pune", to: "Delhi", departureDate: "2026-06-20", passengers: 2, cabinClass: "Economy" },
  { id: "rs-2", from: "Mumbai", to: "Bengaluru", departureDate: "2026-06-24", passengers: 1, cabinClass: "Premium Economy" },
];

const airportCode = (value) => String(value || "AIR").trim().slice(0, 3).toUpperCase();
const cityName = (value) => String(value || "").split(/[,-]/)[0].trim() || value || "Airport";
const matches = (value, query) => !query || String(value || "").toLowerCase().includes(String(query).toLowerCase());

const mapVendorFlight = (listing) => {
  const details = listing.details || {};

  return {
    id: listing._id.toString(),
    source: "vendor",
    vendor: listing.vendor,
    airlineLogoUrl: details.airlineLogoUrl || "",
    airline: details.airlineName || listing.title,
    flightNumber: details.flightNumber || "TIX-FLIGHT",
    from: details.fromCity || cityName(details.fromAirport),
    fromCode: details.fromAirportCode || airportCode(details.fromAirport),
    fromAirport: details.fromAirport || "Airport details unavailable",
    to: details.toCity || cityName(details.toAirport),
    toCode: details.toAirportCode || airportCode(details.toAirport),
    toAirport: details.toAirport || "Airport details unavailable",
    departureDate: details.departureDate || "",
    departureTime: details.departureTime || "",
    arrivalTime: details.arrivalTime || "",
    duration: details.duration || "Duration unavailable",
    stops: details.stops || "Non-stop",
    price: Number(details.ticketPrice || details.price || listing.price || 0),
    rating: "4.5",
    baggage: details.baggageAllowance || details.baggageInfo || "Baggage details unavailable",
    refundable: details.refundPolicy || details.cancellationPolicy || "Cancellation policy unavailable",
    aircraft: details.aircraftType || details.aircraft || "A320",
    aircraftType: details.aircraftType || details.aircraft || "A320",
    cabinClasses: String(details.cabinClass || "Economy")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    cabinClass: details.cabinClass || "Economy",
    reservedSeats: String(details.bookedSeats || "")
      .split(",")
      .map((seat) => seat.trim())
      .filter(Boolean),
    totalSeats: Number(details.totalSeats || details.availableSeats || listing.inventory || 0),
    availableSeats: Math.max(0, Number(details.totalSeats || details.availableSeats || listing.inventory || 0) - String(details.bookedSeats || "").split(",").filter(Boolean).length),
  };
};

const mapFlight = (flight) => ({
  id: flight._id.toString(),
  _id: flight._id,
  source: "vendor-flight",
  vendor: flight.vendor || flight.vendorId,
  airlineLogoUrl: flight.airlineLogo || "",
  airline: flight.airlineName,
  flightNumber: flight.flightNumber,
  from: flight.fromCity || cityName(flight.fromAirport),
  fromCode: flight.fromCode || airportCode(flight.fromAirport),
  fromAirport: flight.fromAirport || "Airport details unavailable",
  to: flight.toCity || cityName(flight.toAirport),
  toCode: flight.toCode || airportCode(flight.toAirport),
  toAirport: flight.toAirport || "Airport details unavailable",
  departureDate: flight.departureDate || "",
  departureTime: flight.departureTime || "",
  arrivalDate: flight.arrivalDate || "",
  arrivalTime: flight.arrivalTime || "",
  duration: flight.duration || "Duration unavailable",
  stops: flight.stops || "Non-stop",
  price: Number(flight.ticketPrice || 0),
  baseFare: Number(flight.baseFare || 0),
  taxes: Number(flight.taxes || 0),
  platformFee: Number(flight.platformFee || 0),
  rating: "4.5",
  baggage: flight.baggageAllowance || "Baggage details unavailable",
  refundable: flight.refundPolicy || flight.cancellationPolicy || "Cancellation policy unavailable",
  aircraft: flight.aircraftType || "A320",
  aircraftType: flight.aircraftType || "A320",
  cabinClasses: [flight.cabinClass || "Economy"],
  cabinClass: flight.cabinClass || "Economy",
  reservedSeats: (flight.seats || []).filter((seat) => seat.status !== "available").map((seat) => seat.seatNumber),
  totalSeats: Number(flight.totalSeats || 0),
  availableSeats: Number(flight.availableSeats || 0),
});

const getVendorFlights = async () => {
  const [listings, flightsFromModel] = await Promise.all([
    VendorListing.find({ module: "flight", status: "active" }).sort({ createdAt: -1 }),
    Flight.find({ status: "active" }).sort({ createdAt: -1 }),
  ]);
  return [...flightsFromModel.map(mapFlight), ...listings.map(mapVendorFlight)];
};

router.get("/flights", async (req, res) => {
  const { from, to, departureDate, cabinClass } = req.query;
  const vendorFlights = await getVendorFlights();
  const allFlights = [...vendorFlights, ...flights];

  const results = allFlights.filter((flight) => (
    (matches(flight.from, from || "") || matches(flight.fromAirport, from || "")) &&
    (matches(flight.to, to || "") || matches(flight.toAirport, to || "")) &&
    (!departureDate || flight.departureDate === departureDate) &&
    (!cabinClass || flight.cabinClasses.includes(cabinClass))
  ));

  res.json(results);
});

router.get("/flights/offers", async (req, res) => {
  const vendorFlights = await getVendorFlights();

  res.json(
    [...vendorFlights, ...flights].map((flight) => ({
      id: flight.id,
      title: `${flight.airline} ${flight.flightNumber}`,
      subtitle: `${flight.fromCode} to ${flight.toCode}`,
      date: flight.departureDate,
      price: flight.price,
      rating: flight.rating,
    }))
  );
});

router.get("/flights/recent-searches", (req, res) => {
  res.json(recentSearches);
});

router.get("/flights/:id", async (req, res) => {
  const flight = flights.find((item) => item.id === req.params.id);
  if (flight) return res.json(flight);

  if (mongoose.isValidObjectId(req.params.id)) {
    const modelFlight = await Flight.findOne({ _id: req.params.id, status: "active" });
    if (modelFlight) return res.json(mapFlight(modelFlight));

    const listing = await VendorListing.findOne({ _id: req.params.id, module: "flight", status: "active" });
    if (listing) return res.json(mapVendorFlight(listing));
  }

  return res.status(404).json({ message: "Flight not found" });
});

module.exports = router;
