const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: String,
    audience: { type: String, enum: ["all", "students", "faculty"], default: "all" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", schema);
