const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    dueDate: Date,
    totalMarks: { type: Number, default: 100 },
    instructions: String,
    supportingMaterial: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", schema);
