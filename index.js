const express = require("express");
const sequelize = require("./sequelize");
require("dotenv").config();

const cors = require("cors");
const path = require("path");

const app = express();

// =============================
// CORS
// =============================

const allowedOrigins = [
  "http://localhost:3000",
  "https://book-verse.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("⚠️ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// =============================
// MODELS
// =============================

require("./models/Book");
require("./models/User");
require("./models/Purchase");
require("./models/Testimonial");
require("./models/Admin");
require("./models/Wishlist");
require("./models/Highlight");
require("./models/ReadingBookmark");
require("./models/ReadingHistory");
require("./models/Notification");

// =============================
// ROUTES
// =============================

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const paymentRoutes = require("./routes/payment");
const purchaseRoutes = require("./routes/purchases");
const adminRoutes = require("./routes/admin");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const highlightRoutes = require("./routes/highlights");
const readingBookmarkRoutes = require("./routes/readingBookmarks");
const readingHistoryRoutes = require("./routes/readingHistory");
const notificationsRoutes = require("./routes/notifications");

// =============================
// MOUNT ROUTES
// =============================

app.use("/auth", authRoutes);
app.use("/books", bookRoutes);
app.use("/payment", paymentRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/admin", adminRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/reviews", reviewRoutes);
app.use("/highlights", highlightRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/reading-bookmarks", readingBookmarkRoutes);
app.use("/reading-history", readingHistoryRoutes);

// =============================
// STATIC UPLOADS
// =============================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =============================
// HEALTH CHECK
// =============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Digital Book Platform API is running",
  });
});

// =============================
// ERROR HANDLER
// =============================

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// =============================
// DATABASE + SERVER
// =============================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("✅ Database connected");

    await sequelize.sync({ alter: true });

    console.log("✅ Database synced");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

startServer();