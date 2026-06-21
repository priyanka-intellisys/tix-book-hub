const mongoose = require("mongoose");

const seatBlockSchema = new mongoose.Schema(
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
    targetType: {
      type: String,
      enum: ["show", "flight", "movie"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["blocked", "removed", "custom"],
      default: "blocked",
    },
  },
  { timestamps: true }
);

seatBlockSchema.index({ vendorId: 1, targetType: 1, targetId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("SeatBlock", seatBlockSchema);
