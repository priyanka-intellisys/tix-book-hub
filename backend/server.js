const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
const { ready: databaseReady } = require("./src/config/db");

const movieRoutes = require("./src/routes/movieRoutes");
const authRoutes = require("./src/routes/auth");
const bookingRoutes = require("./src/routes/bookingRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const catalogRoutes = require("./src/routes/catalogRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const flightRoutes = require("./src/routes/flightRoutes");
const vendorListingRoutes = require("./src/routes/vendorListingRoutes");
const vendorOperationsRoutes = require("./src/routes/vendorOperationsRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const seatRoutes = require("./src/routes/seatRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const userRoutes = require("./src/routes/userRoutes");
const { setIo } = require("./src/socket");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

setIo(io);

io.on("connection", (socket) => {
  socket.on("joinShow", (showId) => {
    if (showId) socket.join(String(showId));
  });

  socket.on("joinVendor", (vendorId) => {
    if (vendorId) socket.join(`vendor:${vendorId}`);
  });
});

app.use(cors());
app.use(express.json({ limit: "75mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "TixHub API", database: "mysql" });
});

app.use("/api", movieRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes);
app.use("/api", flightRoutes);
app.use("/api", bookingRoutes);
app.use("/api", walletRoutes);
app.use("/api", seatRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", vendorOperationsRoutes);
app.use("/api", vendorListingRoutes);
app.use("/api", paymentRoutes);
console.log("Vendor listing routes mounted at /api/vendor-listings");
app.use("/api/admin", adminRoutes);

databaseReady
  .then((isReady) => {
    if (!isReady) {
      console.error("Server not started because MySQL initialization failed");
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server not started because MySQL initialization failed", error);
    process.exit(1);
  });
