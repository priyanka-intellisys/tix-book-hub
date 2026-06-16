const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    theatreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rows: {
      type: Number,
      default: 10,
    },
    seatsPerRow: {
      type: Number,
      default: 12,
    },
    screenType: {
      type: String,
      default: "2D",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Screen", screenSchema);
