const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const cookieToken = req.cookies?.acadx_token;

    const headerToken =
      (req.headers.authorization || "").startsWith("Bearer ")
        ? req.headers.authorization.substring(7)
        : null;

    const token = cookieToken || headerToken;

    if (!token) {
      console.log("❌ AUTH: No token found");

      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ AUTH: JWT_SECRET is missing");

      return res.status(500).json({
        message: "Server authentication configuration error"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      console.log("❌ AUTH: Token has no user ID");

      return res.status(401).json({
        message: "Invalid authentication token"
      });
    }

    const user = await User.findById(decoded.id)
      .populate("department", "name code");

    if (!user) {
      console.log("❌ AUTH: User not found:", decoded.id);

      return res.status(401).json({
        message: "Account not found"
      });
    }

    if (!user.active) {
      console.log("❌ AUTH: User inactive:", user.email);

      return res.status(401).json({
        message: "Account is inactive"
      });
    }

    // Normalize the role so "Admin", "ADMIN", etc.
    // are treated as "admin".
    const normalizedRole = String(user.role || "")
      .trim()
      .toLowerCase();

    user.role = normalizedRole;

    console.log("=================================");
    console.log("✅ AUTHENTICATED USER");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("User ID:", user._id.toString());
    console.log("Active:", user.active);
    console.log("=================================");

    req.user = user;

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication"
    });
  }
}

function roles(...allowed) {
  const normalizedAllowed = allowed.map((role) =>
    String(role).trim().toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const userRole = String(req.user.role || "")
      .trim()
      .toLowerCase();

    console.log("🔐 ROLE CHECK");
    console.log("User role:", userRole);
    console.log("Allowed roles:", normalizedAllowed);

    if (!normalizedAllowed.includes(userRole)) {
      console.log("❌ ROLE DENIED");

      return res.status(403).json({
        message: "You do not have access to this resource"
      });
    }

    console.log("✅ ROLE ALLOWED");

    next();
  };
}

module.exports = {
  protect,
  roles
};