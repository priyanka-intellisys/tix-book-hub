const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

const cleanUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  status: user.status,
  image: user.image,
});

const issueToken = (user, rememberMe = false) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "30d" : "7d" }
  );

const validateRegister = ({ name, email, mobile, password, confirmPassword }) => {
  if (!name || name.trim().length < 3) return "Name must be at least 3 characters";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address";
  if (!mobile || !/^\d{10}$/.test(String(mobile))) return "Enter a valid 10 digit mobile number";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  if (confirmPassword !== undefined && password !== confirmPassword) return "Passwords do not match";
  return null;
};

router.post("/register", async (req, res) => {
  try {
    const error = validateRegister(req.body);
    if (error) return res.status(400).json({ message: error });

    const { name, email, mobile, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const requestedRole = ["vendor", "user"].includes(role) ? role : "user";
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      mobile: String(mobile).trim(),
      password: await bcrypt.hash(password, 12),
      role: requestedRole,
      status: requestedRole === "vendor" ? "pending" : "active",
    });

    const token = issueToken(user, true);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: cleanUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "blocked") return res.status(403).json({ message: "Account is blocked" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: issueToken(user, Boolean(rememberMe)),
      user: cleanUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user: cleanUser(user) });
});

router.post("/logout", requireAuth, (req, res) => {
  res.json({ message: "Logout successful" });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (user) {
    const resetToken = crypto.randomBytes(24).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30;
    await user.save();

    return res.json({
      message: "Password reset token generated",
      resetToken,
    });
  }

  res.json({ message: "If the email exists, reset instructions will be sent" });
});

router.post("/reset-password/:token", async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

module.exports = router;
