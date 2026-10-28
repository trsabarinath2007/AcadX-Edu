const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ questionId: mongoose.Schema.Types.ObjectId, answer: String }],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    submittedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", schema);
