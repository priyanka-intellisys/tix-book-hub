const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const movieRoutes = require("./src/routes/movieRoutes");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/bookingRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const catalogRoutes = require("./src/routes/catalogRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const flightRoutes = require("./src/routes/flightRoutes");
const vendorListingRoutes = require("./src/routes/vendorListingRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tixhub")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "TixHub API" });
});

app.use("/api", movieRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes);
app.use("/api", flightRoutes);
app.use("/api", bookingRoutes);
app.use("/api", walletRoutes);
app.use("/api", vendorListingRoutes);
app.use("/api", paymentRoutes);
console.log("Vendor listing routes mounted at /api/vendor-listings");
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
