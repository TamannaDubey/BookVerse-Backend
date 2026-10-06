const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Purchase = require("../models/Purchase");
const Book = require("../models/Book");
const User = require("../models/User");
const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// ========================================
// ADMIN / USER LOGIN
// POST /admin/login
// ========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("🔐 Login attempt:", normalizedEmail);

    // ==============================
    // ADMIN LOGIN
    // ==============================

    const admin = await Admin.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (admin) {
      console.log("👑 Admin found:", admin.email);

      const passwordMatch = await bcrypt.compare(
        password,
        admin.password_hash
      );

      console.log("🔑 Admin password match:", passwordMatch);

      if (!passwordMatch) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("❌ JWT_SECRET is missing");

        return res.status(500).json({
          error: "Server authentication configuration error",
        });
      }

      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      console.log("🎫 Admin JWT created");

      return res.json({
        message: "Admin login successful",

        token,

        user: {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
      });
    }

    // ==============================
    // NORMAL USER LOGIN
    // ==============================

    const user = await User.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    console.log(
      "👤 User found:",
      user ? user.email : "NO USER"
    );

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log(
      "🔑 User password match:",
      passwordMatch
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "user",
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  }
});

// ========================================
// ADMIN SALES
// GET /admin/sales
// ========================================

router.get("/sales", adminAuth, async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [Book, User],
    });

    res.json(purchases);
  } catch (error) {
    console.error("❌ Sales error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;