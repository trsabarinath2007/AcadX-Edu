
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    // 1. Read the JWT from the HTTP-only cookie or Authorization header.
    const cookieToken = req.cookies?.acadx_token;

    const authorization = req.headers.authorization || "";
    const headerToken = authorization.startsWith("Bearer ")
      ? authorization.substring(7).trim()
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      console.warn(
        "AUTH: No token received for",
        req.method,
        req.originalUrl
      );

      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // 2. Ensure JWT_SECRET is configured on the backend.
    if (!process.env.JWT_SECRET) {
      console.error("AUTH: JWT_SECRET is missing");

      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    // 3. Verify the token.
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.warn("AUTH: Token verification failed:", error.name);

      return res.status(401).json({
        message: "Invalid or expired authentication",
      });
    }

    if (!decoded || !decoded.id) {
      console.warn("AUTH: Token does not contain a user ID");

      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // 4. Load the current user from MongoDB.
    const user = await User.findById(decoded.id)
      .populate("department", "name code");

    if (!user) {
      console.warn("AUTH: Token user was not found");

      return res.status(401).json({
        message: "Account not found",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    // 5. Normalize the role.
    user.role = String(user.role || "")
      .trim()
      .toLowerCase();

    // 6. Make the authenticated user available to route handlers.
    req.user = user;

    console.log(
      `AUTH: Accepted ${req.method} ${req.originalUrl} for role ${user.role}`
    );

    return next();
  } catch (error) {
    console.error("AUTH middleware error:", error.message);

    return res.status(500).json({
      message: "Authentication service error",
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
        message: "Authentication required",
      });
    }

    const userRole = String(req.user.role || "")
      .trim()
      .toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      console.warn(
        `AUTH: Role denied for ${req.method} ${req.originalUrl}`
      );

      return res.status(403).json({
        message: "You do not have access to this resource",
      });
    }

    return next();
  };
}

module.exports = {
  protect,
  roles,
};
