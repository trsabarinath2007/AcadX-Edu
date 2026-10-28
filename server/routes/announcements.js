const express = require("express");
const Announcement = require("../models/Announcement");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const filter = {
    $or: [
      { audience: "all" },
      { audience: req.user.role === "student" ? "students" : "faculty" }
    ]
  };

  const announcements = await Announcement.find(filter)
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });

  res.json({ announcements });
});

router.post("/", async (req, res) => {
  if (!["admin", "faculty"].includes(req.user.role)) return res.status(403).json({ message: "Admin/Faculty only" });

  const announcement = await Announcement.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json({ announcement });
});

module.exports = router;
