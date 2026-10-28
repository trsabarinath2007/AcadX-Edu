const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    semester: Number,
    internalMarks: Number,
    externalMarks: Number,
    totalMarks: Number,
    grade: String,
    gpa: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicRecord", schema);
