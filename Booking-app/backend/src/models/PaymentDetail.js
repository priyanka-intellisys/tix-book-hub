const mongoose = require("mongoose");

const paymentDetailSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessName: String,
    businessType: String,
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    panNumber: String,
    gstNumber: String,
    settlementPreference: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      default: "Weekly",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentDetail", paymentDetailSchema);
