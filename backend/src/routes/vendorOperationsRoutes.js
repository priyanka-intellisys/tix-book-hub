const express = require("express");

const {
  checkInQrTicket,
  createNotification,
  createScreen,
  createShow,
  createStaff,
  createTheatre,
  deleteScreen,
  deleteShow,
  deleteTheatre,
  getCustomerList,
  getNotifications,
  getPayoutHistory,
  getPricing,
  getRefundRequests,
  getScreens,
  getShowAnalytics,
  getShows,
  getStaff,
  getTheatreOverview,
  getTheatres,
  getTicketScanner,
  savePayout,
  savePricing,
  saveScreenLayout,
  scanTicket,
  updateScreen,
  updateShow,
  updateMovieStatus,
  updateRefundStatus,
  updateShowPrice,
  updateStaff,
  updateTheatre,
  verifyQrTicket,
} = require("../controllers/vendorOperationsController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.use("/vendor", requireAuth, requireRole("admin", "vendor"));

router.get("/vendor/ticket-scans", asyncHandler(getTicketScanner));
router.post("/vendor/ticket-scans", asyncHandler(scanTicket));
router.get("/vendor/qr/verify", asyncHandler(verifyQrTicket));
router.post("/vendor/qr/verify", asyncHandler(verifyQrTicket));
router.post("/vendor/qr/check-in", asyncHandler(checkInQrTicket));
router.get("/vendor/qr/scans", asyncHandler(getTicketScanner));
router.get("/vendor/theatre-overview", asyncHandler(getTheatreOverview));
router.get("/vendor/theatres", asyncHandler(getTheatres));
router.post("/vendor/theatres", asyncHandler(createTheatre));
router.put("/vendor/theatres/:id", asyncHandler(updateTheatre));
router.delete("/vendor/theatres/:id", asyncHandler(deleteTheatre));
router.get("/vendor/screens", asyncHandler(getScreens));
router.get("/vendor/screens/:movieId", asyncHandler(getScreens));
router.post("/vendor/screens", asyncHandler(createScreen));
router.post("/vendor/screens/:screenId/layout", asyncHandler(saveScreenLayout));
router.post("/vendor/seat-layout", asyncHandler((req, res) => {
  req.params.screenId = req.body.screenId || req.body.screen_id;
  return saveScreenLayout(req, res);
}));
router.put("/vendor/screens/:id", asyncHandler(updateScreen));
router.delete("/vendor/screens/:id", asyncHandler(deleteScreen));
router.get("/vendor/shows", asyncHandler(getShows));
router.post("/vendor/shows", asyncHandler(createShow));
router.put("/vendor/shows/:id", asyncHandler(updateShow));
router.delete("/vendor/shows/:id", asyncHandler(deleteShow));
router.get("/vendor/show-analytics", asyncHandler(getShowAnalytics));
router.get("/vendor/pricing", asyncHandler(getPricing));
router.put("/vendor/pricing", asyncHandler(savePricing));
router.patch("/vendor/shows/:showId/price", asyncHandler(updateShowPrice));
router.get("/vendor/refunds", asyncHandler(getRefundRequests));
router.patch("/vendor/refunds/:id", asyncHandler(updateRefundStatus));
router.get("/vendor/payouts", asyncHandler(getPayoutHistory));
router.post("/vendor/payouts", asyncHandler(savePayout));
router.get("/vendor/staff", asyncHandler(getStaff));
router.post("/vendor/staff", asyncHandler(createStaff));
router.patch("/vendor/staff/:id", asyncHandler(updateStaff));
router.get("/vendor/notifications", asyncHandler(getNotifications));
router.post("/vendor/notifications", asyncHandler(createNotification));
router.get("/vendor/customer-list", asyncHandler(getCustomerList));
router.patch("/vendor/movies/:id/status", asyncHandler(updateMovieStatus));

router.use((error, req, res, next) => {
  console.error("[vendor-operations:error]", {
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    name: error.name,
  });
  res.status(error.statusCode || 500).json({ message: error.message || "Vendor operation failed" });
});

module.exports = router;
