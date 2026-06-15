const express = require("express");

const {
  createVendorListing,
  deleteVendorListing,
  getVendorBookings,
  getVendorListings,
  getVendorReports,
  updateVendorListing,
} = require("../controllers/vendorListingController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const vendorPaths = ["/vendor-listings", "/vendor-bookings", "/vendor-reports"];

router.use(vendorPaths, (req, res, next) => {
  console.log(`[vendor-listings:route] ${req.method} ${req.originalUrl}`);
  next();
});

router.use(vendorPaths, requireAuth, requireRole("admin", "vendor"));

router.get("/vendor-listings", asyncHandler(getVendorListings));
router.post("/vendor-listings", asyncHandler(createVendorListing));
router.put("/vendor-listings/:id", asyncHandler(updateVendorListing));
router.delete("/vendor-listings/:id", asyncHandler(deleteVendorListing));
router.get("/vendor-bookings", asyncHandler(getVendorBookings));
router.get("/vendor-reports", asyncHandler(getVendorReports));

router.use((error, req, res, next) => {
  console.error("[vendor-listings:error]", {
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    name: error.name,
  });

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors).map((item) => item.message).join(", "),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  res.status(500).json({ message: error.message || "Unable to save listing" });
});

module.exports = router;
