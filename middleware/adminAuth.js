const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Admin authentication required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Admin token missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing");

      return res.status(500).json({
        error: "Server authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error("❌ Admin auth error:", error);

    return res.status(401).json({
      error: "Invalid or expired admin token",
    });
  }
}

module.exports = adminAuth;