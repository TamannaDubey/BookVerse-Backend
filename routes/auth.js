const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Admin = require("../models/Admin");

const router = express.Router();


// =====================================================
// USER SIGNUP
// =====================================================

router.post("/signup", async (req, res) => {
  let { name, email, phone, password } = req.body;

  try {

    // REQUIRED FIELDS
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }


    // NAME VALIDATION
    name = name.trim();

    if (name.length < 2) {
      return res.status(400).json({
        error: "Name must contain at least 2 characters"
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        error: "Name must not exceed 50 characters"
      });
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
      return res.status(400).json({
        error: "Name can contain only letters and spaces"
      });
    }


    // EMAIL VALIDATION
    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address"
      });
    }


    // PHONE VALIDATION
    if (phone) {
      phone = phone.trim();

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({
          error: "Phone number must contain exactly 10 digits"
        });
      }
    }


    // PASSWORD VALIDATION
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
    }

    if (password.length > 64) {
      return res.status(400).json({
        error: "Password must not exceed 64 characters"
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter"
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one lowercase letter"
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one number"
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one special character"
      });
    }


    // CHECK EXISTING USER EMAIL
    const existingEmail = await User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({
        error: "An account with this email already exists"
      });
    }


    // CHECK EXISTING USER PHONE
    if (phone) {

      const existingPhone = await User.findOne({
        where: { phone }
      });

      if (existingPhone) {
        return res.status(400).json({
          error: "An account with this phone number already exists"
        });
      }
    }


    // HASH PASSWORD
    const hash = await bcrypt.hash(password, 12);


    // CREATE USER
    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password_hash: hash
    });


    return res.status(201).json({
      message: "User registered successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "user"
      }
    });

  } catch (err) {

    console.error("❌ SIGNUP ERROR:", err);

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: err.errors?.[0]?.message || "Validation error"
      });
    }

    if (err.name === "SequelizeUniqueConstraintError") {

      const field = err.errors?.[0]?.path;

      if (field === "email") {
        return res.status(400).json({
          error: "An account with this email already exists"
        });
      }

      if (field === "phone") {
        return res.status(400).json({
          error: "An account with this phone number already exists"
        });
      }

      return res.status(400).json({
        error: "Email or phone number already exists"
      });
    }

    return res.status(500).json({
      error: "Signup failed"
    });
  }
});


// =====================================================
// LOGIN - USER + ADMIN
// =====================================================

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    // REQUIRED FIELDS
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }


    // NORMALIZE EMAIL
    const normalizedEmail = email.trim().toLowerCase();

    console.log("🔐 Login attempt:", normalizedEmail);


    // =================================================
    // FIRST CHECK ADMIN TABLE
    // =================================================

    const admin = await Admin.findOne({
      where: {
        email: normalizedEmail
      }
    });

    console.log(
      "👑 Admin found:",
      admin ? admin.email : "NO ADMIN"
    );


    // =================================================
    // ADMIN LOGIN
    // =================================================

    if (admin) {

      console.log("👑 Admin login detected");

      const passwordMatch = await bcrypt.compare(
        password,
        admin.password_hash
      );

      console.log(
        "🔑 Admin password match:",
        passwordMatch
      );

      if (!passwordMatch) {
        return res.status(401).json({
          error: "Invalid email or password"
        });
      }


      // ADMIN JWT
      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: "admin"
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      console.log(
        "🎫 Admin JWT created for:",
        admin.email
      );


      return res.json({

        message: "Admin login successful",

        token,

        user: {
          id: admin.id,
          name: "Administrator",
          email: admin.email,
          phone: null,
          role: "admin"
        }

      });
    }


    // =================================================
    // IF NOT ADMIN → CHECK USER TABLE
    // =================================================

    const user = await User.findOne({
      where: {
        email: normalizedEmail
      }
    });

    console.log(
      "👤 User found:",
      user ? user.email : "NO USER"
    );


    // USER NOT FOUND
    if (!user) {

      return res.status(401).json({
        error: "Invalid email or password"
      });

    }


    // =================================================
    // USER PASSWORD CHECK
    // =================================================

    console.log(
      "🔑 Password hash exists:",
      !!user.password_hash
    );

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log(
      "✅ User password match:",
      passwordMatch
    );


    if (!passwordMatch) {

      return res.status(401).json({
        error: "Invalid email or password"
      });

    }


    // =================================================
    // USER JWT
    // =================================================

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: "user"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );


    console.log(
      "🎫 User JWT created for:",
      user.email
    );


    // =================================================
    // USER LOGIN SUCCESS
    // =================================================

    return res.json({

      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "user"
      }

    });

  } catch (err) {

    console.error("❌ LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Login failed"
    });

  }

});


module.exports = router;