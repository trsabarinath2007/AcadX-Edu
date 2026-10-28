const express = require("express");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { signToken, publicUser } = require("../utils/token");

const router = express.Router();

/*
=========================================================
LOGIN
POST /api/auth/login
=========================================================
*/

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("password")
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      /*
      -----------------------------------------------------
      VALIDATION
      -----------------------------------------------------
      */

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
        });
      }

      /*
      -----------------------------------------------------
      GET LOGIN DETAILS
      -----------------------------------------------------
      */

      const email = String(req.body.email)
        .trim()
        .toLowerCase();

      const password = String(req.body.password);

      /*
      -----------------------------------------------------
      FIND USER
      -----------------------------------------------------
      */

      const user = await User.findOne({
        email,
      })
        .select("+password")
        .populate("department", "name code");

      /*
      -----------------------------------------------------
      INVALID USER
      -----------------------------------------------------
      */

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      /*
      -----------------------------------------------------
      ACCOUNT STATUS
      -----------------------------------------------------
      */

      if (!user.active) {
        return res.status(403).json({
          message: "Your account is inactive. Please contact the administrator.",
        });
      }

      /*
      -----------------------------------------------------
      PASSWORD CHECK
      -----------------------------------------------------
      */

      const passwordMatches =
        await user.comparePassword(password);

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      /*
      -----------------------------------------------------
      CREATE JWT
      -----------------------------------------------------
      */

      const token = signToken(user);

      /*
      -----------------------------------------------------
      SET HTTP-ONLY COOKIE
      -----------------------------------------------------
      */

      res.cookie("acadx_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      /*
      -----------------------------------------------------
      PUBLIC USER RESPONSE
      -----------------------------------------------------
      */

      const safeUser = publicUser(user);

      /*
      Make sure these important fields are available
      to the frontend.
      */

      safeUser.mustChangePassword =
        Boolean(user.mustChangePassword);

      safeUser.role =
        String(user.role || "")
          .trim()
          .toLowerCase();

      /*
      -----------------------------------------------------
      SUCCESS
      -----------------------------------------------------
      */

      return res.status(200).json({
        message: "Login successful",
        user: safeUser,
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        message: "Login failed. Please try again.",
      });
    }
  }
);

/*
=========================================================
LOGOUT
POST /api/auth/logout
=========================================================
*/

router.post("/logout", (req, res) => {
  res.clearCookie("acadx_token", {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

/*
=========================================================
CURRENT USER
GET /api/auth/me
=========================================================
*/

router.get("/me", protect, (req, res) => {
  try {
    const safeUser = publicUser(req.user);

    safeUser.mustChangePassword =
      Boolean(req.user.mustChangePassword);

    safeUser.role =
      String(req.user.role || "")
        .trim()
        .toLowerCase();

    return res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error("Auth /me error:", error);

    return res.status(500).json({
      message: "Failed to load current user",
    });
  }
});

module.exports = router;