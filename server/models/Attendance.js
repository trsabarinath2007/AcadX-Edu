const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["present", "absent"],
      required: true
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);


/*
 * One attendance record per:
 *
 * Course + Student + Section + Date
 *
 * This prevents duplicate attendance
 * for the same student in the same
 * course/section on the same day.
 */
schema.index(
  {
    course: 1,
    student: 1,
    section: 1,
    date: 1
  },
  {
    unique: true
  }
);


module.exports = mongoose.model(
  "Attendance",
  schema
);