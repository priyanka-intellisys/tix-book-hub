const express = require("express");
const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER HIT ✅", req.body);

    const { name, email, mobile, password } = req.body;

    // ✅ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    // ✅ SAVE TO DB
    await newUser.save();

    // ✅ ADD THIS (VERY IMPORTANT DEBUG LINE)
    console.log("User saved in DB ✅", newUser);

    res.status(201).json({
      message: "Registration successful",
    });

  } catch (error) {
    console.log("Register Error ❌", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN HIT ✅", req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {
    console.log("Login Error ❌", error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
``