const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/vendors", requireAuth, requireRole("admin", "vendor"), async (req, res) => {
  if (req.user.role === "vendor") {
    return res.json([{ id: req.user.id, _id: req.user.id, name: req.user.name, email: req.user.email }]);
  }

  const vendors = await User.find({ role: "vendor", status: "active" }).sort({ name: 1 });
  res.json(vendors.map((vendor) => ({
    id: vendor._id,
    _id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    mobile: vendor.mobile,
  })));
});

module.exports = router;
