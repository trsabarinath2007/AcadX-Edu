const express = require("express");
const { protect } = require("../middleware/auth");
const { generateAIResponse } = require("../services/ai");
const User = require("../models/User");
const Course = require("../models/Course");
const AcademicRecord = require("../models/AcademicRecord");
const Attendance = require("../models/Attendance");

const router = express.Router();

async function getStudentContext(user) {
  if (!user || !["student", "faculty"].includes(user.role)) return "";

  const [courses, records, attendance] = await Promise.all([
    Course.find(
      user.role === "student"
        ? {
            department: user.department?._id || user.department,
            semester: user.semester,
            ...(user.section ? { sections: user.section } : {})
          }
        : { faculty: user._id }
    )
      .select("code name semester sections credits content")
      .lean()
      .limit(30),
    user.role === "student"
      ? AcademicRecord.find({ student: user._id })
          .populate("course", "code name")
          .select("course semester internalMarks externalMarks totalMarks grade gpa")
          .lean()
          .limit(50)
      : [],
    user.role === "student"
      ? Attendance.find({ student: user._id })
          .populate("course", "code name")
          .select("course date status")
          .sort({ date: -1 })
          .limit(100)
          .lean()
      : []
  ]);

  return JSON.stringify({
    user: {
      role: user.role,
      department: user.department?.code || user.department?.name || user.department,
      semester: user.semester,
      section: user.section
    },
    courses,
    academicRecords: records,
    recentAttendance: attendance
  }, null, 2);
}

/*
POST /api/ai/chat
*/
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const privateContext = await getStudentContext(req.user);
    const response = await generateAIResponse(
      message,
      [privateContext, context || ""].filter(Boolean).join("\n"),
      history
    );

    res.json({ response });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(error.code === "AI_NOT_CONFIGURED" ? 503 : 500).json({
      message:
        error.code === "AI_NOT_CONFIGURED"
          ? "AI is not configured on the server. Please add GEMINI_API_KEY."
          : "Failed to generate AI response"
    });
  }
});

/*
POST /api/ai/study
*/
router.post("/study", protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const privateContext = await getStudentContext(req.user);
    const context = `
You are the AcadX Study Assistant.
The student can ask about any academic subject, programming language,
DSA, database, operating systems, networks, software engineering,
mathematics, exam preparation, assignments, projects, or study planning.

When a question relates to a course in the supplied context, use that course
content to make the explanation specific. Do not expose private information
about other students.
${privateContext}
`;

    const response = await generateAIResponse(message, context, history);
    res.json({ response });
  } catch (error) {
    console.error("Study Assistant Error:", error);
    res.status(error.code === "AI_NOT_CONFIGURED" ? 503 : 500).json({
      message:
        error.code === "AI_NOT_CONFIGURED"
          ? "AI is not configured on the server. Please add GEMINI_API_KEY."
          : "Failed to generate study response"
    });
  }
});

/*
POST /api/ai/analyze
*/
router.post("/analyze", protect, async (req, res) => {
  try {
    const { message, data } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "Analysis request is required" });
    }

    const response = await generateAIResponse(
      message,
      `Academic data supplied by the application:\n${JSON.stringify(data || {}, null, 2)}`,
      []
    );

    res.json({ response });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(error.code === "AI_NOT_CONFIGURED" ? 503 : 500).json({
      message:
        error.code === "AI_NOT_CONFIGURED"
          ? "AI is not configured on the server. Please add GEMINI_API_KEY."
          : "Failed to generate analysis"
    });
  }
});

/*
POST /api/ai/admin
*/
router.post("/admin", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { question, data } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const response = await generateAIResponse(
      question,
      `Institutional data supplied by the admin dashboard:\n${JSON.stringify(data || {}, null, 2)}`,
      []
    );

    res.json({ response });
  } catch (error) {
    console.error("Admin AI Error:", error);
    res.status(error.code === "AI_NOT_CONFIGURED" ? 503 : 500).json({
      message:
        error.code === "AI_NOT_CONFIGURED"
          ? "AI is not configured on the server. Please add GEMINI_API_KEY."
          : "Failed to generate admin AI response"
    });
  }
});

module.exports = router;
