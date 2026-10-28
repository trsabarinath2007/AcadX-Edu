const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/profile", async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("department", "name code")
    .populate("facultyCourses", "code name")
    .select("-password");
  res.json({ user });
});

router.patch("/profile", async (req, res) => {
  const allowed = ["name", "email", "section"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true })
    .populate("department", "name code")
    .select("-password");

  res.json({ user });
});

router.patch("/password", async (req, res) => {
  if (!req.body.currentPassword || !req.body.newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required" });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ message: "Password changed successfully" });
});

module.exports = router;
