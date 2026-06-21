const mongoose = require("mongoose");

const flightSeatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ["available", "booked", "blocked"], default: "available" },
    bookingId: { type: mongoose.Schema.Types.Mixed, default: null },
    passengerName: { type: String, default: "" },
    pnr: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "" },
    bookingStatus: { type: String, default: "" },
    bookingDate: { type: Date },
    seatType: { type: String, enum: ["window", "middle", "aisle"], default: "middle" },
  },
  { _id: false }
);

const flightSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    airlineName: { type: String, required: true, trim: true },
    airlineLogo: { type: String, trim: true, default: "" },
    flightNumber: { type: String, required: true, trim: true },
    aircraftType: { type: String, enum: ["A320", "B737", "ATR72", "B777"], default: "A320" },
    cabinClass: { type: String, enum: ["Economy", "Premium Economy", "Business", "First Class"], default: "Economy" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    fromCity: { type: String, trim: true, default: "" },
    fromAirport: { type: String, trim: true, default: "" },
    fromCode: { type: String, trim: true, uppercase: true, default: "" },
    toCity: { type: String, trim: true, default: "" },
    toAirport: { type: String, trim: true, default: "" },
    toCode: { type: String, trim: true, uppercase: true, default: "" },
    departureDate: { type: String, default: "" },
    departureTime: { type: String, default: "" },
    arrivalDate: { type: String, default: "" },
    arrivalTime: { type: String, default: "" },
    duration: { type: String, trim: true, default: "" },
    stops: { type: String, enum: ["Non-stop", "1 Stop", "2 Stops"], default: "Non-stop" },
    baseFare: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    ticketPrice: { type: Number, default: 0 },
    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    bookedSeats: { type: Number, default: 0 },
    blockedSeats: { type: Number, default: 0 },
    seats: { type: [flightSeatSchema], default: [] },
    baggageAllowance: { type: String, trim: true, default: "" },
    refundPolicy: { type: String, trim: true, default: "" },
    cancellationPolicy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flight", flightSchema);
