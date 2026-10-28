const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User");
const Material = require("../models/Material");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  let courses = [];

  if (req.user.role === "student") {
    courses = await Course.find({
      department: req.user.department?._id || req.user.department,
      semester: req.user.semester,
      ...(req.user.section ? { sections: req.user.section } : {})
    }).populate("faculty", "name email");
  } else if (req.user.role === "faculty") {
    courses = await Course.find({ faculty: req.user._id }).populate("department", "name code");
  } else {
    courses = await Course.find().populate("department", "name code").populate("faculty", "name");
  }

  res.json({ courses });
});

router.get("/:courseId/materials", async (req, res) => {
  const materials = await Material.find({ course: req.params.courseId })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  res.json({ materials });
});

router.post("/:courseId/materials", async (req, res) => {
  if (!["admin", "faculty"].includes(req.user.role)) return res.status(403).json({ message: "Faculty/Admin only" });

  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (req.user.role === "faculty" && String(course.faculty) !== String(req.user._id)) {
    return res.status(403).json({ message: "Course is not assigned to you" });
  }

  const material = await Material.create({
    ...req.body,
    course: course._id,
    createdBy: req.user._id
  });
  res.status(201).json({ material });
});

module.exports = router;
