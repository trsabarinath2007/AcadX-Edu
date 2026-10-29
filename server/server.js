
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const connectDB = require("./config/db");

/* =========================================================
   ROUTES
========================================================= */

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const courseRoutes = require("./routes/courses");
const assignmentRoutes = require("./routes/assignments");
const quizRoutes = require("./routes/quizzes");
const attendanceRoutes = require("./routes/attendance");
const analyticsRoutes = require("./routes/analytics");
const aiRoutes = require("./routes/ai");
const discussionRoutes = require("./routes/discussions");
const notificationRoutes = require("./routes/notifications");
const announcementRoutes = require("./routes/announcements");
const userRoutes = require("./routes/users");
const academicRoutes = require("./routes/academic");

/* =========================================================
   APP
========================================================= */

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",

  // Main Vercel production domain
  "https://acad-x-edu-ybjx.vercel.app",

  // Known Vercel deployments
  "https://acad-x-edu-ybjx-a08fuf7pp-sabari-d70c.vercel.app",
  "https://acad-x-edu-ybjx-git-main-sabari-d70c.vercel.app",
  "https://acad-x-edu-ybjx-kng0zs650-sabari-d70c.vercel.app",
]);

if (process.env.CLIENT_URL) {
  allowedOrigins.add(process.env.CLIENT_URL.replace(/\/+$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      let isProjectVercelDomain = false;

      try {
        const hostname = new URL(normalizedOrigin).hostname;

        isProjectVercelDomain =
          hostname === "acad-x-edu-ybjx.vercel.app" ||
          (hostname.startsWith("acad-x-edu-ybjx-") &&
            hostname.endsWith(".vercel.app"));
      } catch {
        isProjectVercelDomain = false;
      }

      if (
        allowedOrigins.has(normalizedOrigin) ||
        isProjectVercelDomain
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================================================
   BODY PARSERS
========================================================= */

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   COOKIES
========================================================= */

app.use(cookieParser());

/* =========================================================
   LOGGER
========================================================= */

app.use(morgan("dev"));

/* =========================================================
   UPLOADS
========================================================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "AcadX",
    message: "AcadX API is running",
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/users", userRoutes);

/* =========================================================
   SERVE FRONTEND BUILD
========================================================= */

const clientDist = path.join(__dirname, "..", "client", "dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get("*splat", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    res.sendFile(path.join(clientDist, "index.html"));
  });
}

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  if (
    err.message &&
    err.message.startsWith("CORS blocked origin:")
  ) {
    return res.status(403).json({
      message: "Origin not allowed by CORS",
    });
  }

  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error",
  });
});

/* =========================================================
   DATABASE + SERVER
========================================================= */

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `AcadX server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Database connection failed:",
      error.message
    );

    process.exit(1);
  });
