const express = require("express");
const mongoose = require("mongoose");

const VendorListing = require("../models/VendorListing");

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
    airline: details.airlineName || listing.title,
    flightNumber: details.flightNumber || "TIX-FLIGHT",
    from: cityName(details.fromAirport),
    fromCode: airportCode(details.fromAirport),
    fromAirport: details.fromAirport || "Airport details unavailable",
    to: cityName(details.toAirport),
    toCode: airportCode(details.toAirport),
    toAirport: details.toAirport || "Airport details unavailable",
    departureDate: details.departureDate || "",
    departureTime: details.departureTime || "",
    arrivalTime: details.arrivalTime || "",
    duration: details.duration || "Duration unavailable",
    stops: "Non-stop",
    price: Number(details.price || listing.price || 0),
    rating: "4.5",
    baggage: details.baggageInfo || "Baggage details unavailable",
    refundable: details.cancellationPolicy || "Cancellation policy unavailable",
    aircraft: details.cabinClass || "Configured cabin",
    cabinClasses: String(details.cabinClass || "Economy")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    reservedSeats: [],
    availableSeats: Number(details.availableSeats || listing.inventory || 0),
  };
};

const getVendorFlights = async () => {
  const listings = await VendorListing.find({ module: "flight", status: "active" }).sort({ createdAt: -1 });
  return listings.map(mapVendorFlight);
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
    const listing = await VendorListing.findOne({ _id: req.params.id, module: "flight", status: "active" });
    if (listing) return res.json(mapVendorFlight(listing));
  }

  return res.status(404).json({ message: "Flight not found" });
});

module.exports = router;
