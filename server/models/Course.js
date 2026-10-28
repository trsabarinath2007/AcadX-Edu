const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    unitNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    topics: [{ type: String, trim: true }],
    content: { type: String, default: "" }
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 10, index: true },
    sections: [{ type: String, trim: true, uppercase: true }],
    credits: { type: Number, default: 3, min: 1, max: 10 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    // Complete course content. Admins can maintain the whole syllabus
    // in MongoDB instead of relying on hard-coded frontend data.
    content: {
      description: { type: String, default: "" },
      objectives: [{ type: String, trim: true }],
      prerequisites: [{ type: String, trim: true }],
      units: [unitSchema],
      referenceBooks: [{ type: String, trim: true }],
      outcomes: [{ type: String, trim: true }]
    }
  },
  { timestamps: true }
);

schema.index({ department: 1, semester: 1, sections: 1 });

module.exports = mongoose.model("Course", schema);
