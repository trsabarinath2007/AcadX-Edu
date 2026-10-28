const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: String,
    marks: { type: Number, default: 1 }
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    topic: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    durationMinutes: { type: Number, default: 20 },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", schema);
