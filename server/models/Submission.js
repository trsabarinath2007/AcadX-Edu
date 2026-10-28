const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: String,
    fileUrl: String,
    submittedAt: Date,
    marks: Number,
    feedback: String,
    status: { type: String, enum: ["draft", "submitted", "graded"], default: "draft" }
  },
  { timestamps: true }
);

schema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", schema);
