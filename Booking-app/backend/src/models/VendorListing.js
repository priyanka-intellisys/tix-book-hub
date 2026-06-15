const mongoose = require("mongoose");

const vendorListingSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    module: {
      type: String,
      enum: ["flight", "hotel", "event", "bus", "travel-package"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    route: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    inventory: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "draft", "paused"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorListing", vendorListingSchema);
